import { action, observable, toJS } from 'mobx';
import axios from 'axios';
import Router from 'next/router';
import stringFromUTF8Array from '../utils/batostr';

class BobsStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.getList = this.getList.bind(this);
        this.decryptList = this.decryptList.bind(this);
    }

    @observable publicKey = null;
    @observable list = [];
    @observable newBob = null;
    @observable getListStatus = 'init';

    @observable showAddContactModal = false;
    @observable showContactInfoModal = false;
    @observable showContactEditModal = false;
    @observable showAddGroupModal = false;

    @observable firstNameEdit = '';
    @observable lastNameEdit = '';
    @observable fullName = null;

    @observable contactLastName = '';
    @observable contactFirstName = '';
    @observable contactPublicKey = '';

    @action
    setBob(publicKey) {
        const { alice, cdm } = this.stores;
        sessionStorage.setItem('bobPublicKey', publicKey);
        this.publicKey = publicKey;
        Router.push(`/index?publicKey=${publicKey}`, `/pk/${publicKey}`);

        this.setFullName();
        cdm.initLevelDB(alice.publicKey, publicKey);
        cdm.getList();
    }

    @action
    reset() {
        const { cdm } = this.stores;
        this.publicKey = null;
        this.fullName = null;
        cdm.list = [];
        sessionStorage.removeItem('bobPublicKey');
        Router.push('/');
    }

    @action
    setFullName() {
        const { cdm } = this.stores;
        if (this.list.length > 0) {
            const currentEl = this.list.filter(el => el.accounts[0].publicKey === this.publicKey)[0];
            if (currentEl.index === 0) {
                this.fullName = 'Saved Messages';
            }
            if (currentEl.index > 0) {
                const fullName = [currentEl.accounts[0].firstName, currentEl.accounts[0].lastName].join(' ').trim();
                this.fullName = fullName === '' ? currentEl.accounts[0].publicKey : fullName;
            }
            cdm.getListStatus = 'init';
            cdm.list = currentEl.cdm ? [currentEl.cdm] : [];
        }
    }

    @action
    saveUserInfo() {
        const { alice } = this.stores;
        const formConfig = {}
        const formData = new FormData();
        formData.append('account', alice.publicKey);
        formData.append('publicKey', this.publicKey);
        formData.append('firstName', this.firstNameEdit);
        formData.append('lastName', this.lastNameEdit);

        axios
            .post(`${process.env.API_HOST}/api/v1/contact`, formData, formConfig)
            .then(res => {
                this.showContactEditModal = false;
                const fullName = `${this.firstNameEdit} ${this.lastNameEdit}`.trim();
                this.fullName = fullName;
            })
    }


    @action
    saveContact() {
        const { alice, contacts } = this.stores;
        const formConfig = {}
        const formData = new FormData();
        formData.append('account', alice.publicKey);
        formData.append('publicKey', this.contactPublicKey);
        formData.append('firstName', this.contactFirstName);
        formData.append('lastName', this.contactLastName);

        axios
            .post(`${process.env.API_HOST}/api/v1/contact`, formData, formConfig)
            .then(res => {
                this.showAddContactModal = false;
            })
    }

    @action
    getList() {
        const { alice, utils, cdm, contacts } = this.stores;
        const formConfig = {}

        if (alice.publicKey === null) {
            return;
        }

        
                    
        this.getListStatus = 'fetching';
        utils.sleep(this.list ? 400 : 0).then(() => {
            axios
                .get(`${process.env.API_HOST}/api/v1/interlocutors/${alice.publicKey}`, formConfig)
                .then(res => {
                    contacts.list = res.data.contacts;
                    return this.decryptList(res.data.interlocutors);
                })
                .then(list => {
                    const promises = [];
                    for (let i = 0; i < list.length; i += 1) {
                        if (cdm.readCdmDB === null) {
                            cdm.initLevelDB(alice.publicKey, list[i].accounts[0].publicKey)
                        }
                        const p = cdm.readCdmDB.get(list[i].accounts[0].publicKey).then(res => {
                            const listEl =  list[i];
                            listEl.readCdms = parseInt(stringFromUTF8Array(res));
                            return listEl;
                        })
                        .catch(e => {
                            if (e.type === 'NotFoundError') {
                                const listEl =  list[i]
                                listEl.readCdms = 0;
                                return listEl;
                            }   
                            console.log(e);
                        });
                        promises.push(p);
                    }

                    return Promise.all(promises).then(res => {
                        return res
                    });
                })
                .then(list => {                    
                    const currentEl = list.filter(el => el.accounts[0].publicKey === this.publicKey);
                    if (currentEl.length > 0) { return list; }
                    if (this.publicKey === null) { return list; }

                    const contact = contacts.list.filter(el => el.publicKey === this.publicKey);

                    let newContact = null;
                    if (contact.length > 0) {
                        newContact = {
                            accounts: [{
                                publicKey: this.publicKey,
                                firstName: contact[0].firstName,
                                lastName: contact[0].lastName,
                                created: contact[0].created,
                            }],
                            totalCdms: 0,
                            readCdms: 0,
                            cdm: null,
                        }
                    } else {
                        newContact = {
                            accounts: [{
                                publicKey: this.publicKey,
                                firstName: null,
                                lastName: null,
                                created: null,
                            }],
                            totalCdms: 0,
                            readCdms: 0,
                            cdm: null,
                        }
                    }
                    
                    cdm.list = [];
                    list.splice(1, 0, newContact);
                    return list;
                })
                .then(list => {
                    if (this.publicKey === null) { return list }
                    const currentEl = list.filter(el => el.accounts[0].publicKey === this.publicKey)[0];
                    const pending = cdm.list.filter(el => el.type === 'pending');
                    if (currentEl.totalCdms > cdm.list.length - pending.length) {
                        cdm.getList();
                    }
                    return list;
                })
                .then(list => {
                    this.list = list;
                    this.getListStatus = 'success';
                })
                .catch(e => {
                    console.log(e);
                    this.getListStatus = 'error';
                })
        });
    }

    @action
    decryptList(list) {
        const { crypto, bob } = this.stores;
        const decList = [];
        const promises = [];
        for (let i = 0; i < list.length; i += 1) {
            if (list[i].cdm) {
                const p = crypto.decryptMessage(list[i].cdm.message, list[i].accounts[0].publicKey)
                    .then(res => {
                        list[i].cdm.message = res;
                        decList.push(list[i]);
                    });
                promises.push(p);
            } else {
                decList.push(list[i]);
            }
        }

        return Promise.all(promises)
            .then(_ => {
                return decList;
            })
            .catch(e => console.log(e));
    }
}

export default BobsStore;

