import { action, observable, toJS } from 'mobx';
import axios from 'axios';
import Router from 'next/router';
import stringFromUTF8Array from './../utils/batostr';

class BobsStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.getList = this.getList.bind(this);
        this.decryptList = this.decryptList.bind(this);
    }

    @observable publicKey = null;
    @observable list = null;
    @observable data = null;
    @observable newBob = null;
    @observable getListStatus = 'init';

    @observable bobDB = null;
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
        sessionStorage.setItem('bobPublicKey', publicKey);
        this.publicKey = publicKey;
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
        const { alice, bob, utils, cdm, contacts } = this.stores;
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
                            const listEl =  list[i]
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
                    const currentEl = list.filter(el => el.accounts[0].publicKey === bob.publicKey);
                    if (currentEl.length > 0) { return list; }
                    if (bob.publicKey === null) { return list; }

                    const contact = contacts.list.filter(el => el.publicKey === bob.publicKey);

                    let newContact = null;
                    let fullName = null;
                    if (contact.length > 0) {
                        newContact = {
                            accounts: [{
                                publicKey: bob.publicKey,
                                firstName: contact[0].firstName,
                                lastName: contact[0].lastName,
                                created: contact[0].created,
                            }],
                            totalCdms: 0,
                            readCdms: 0,
                            cdm: null,
                        }
                        fullName = [contact[0].firstName, contact[0].lastName].join(' ').trim()
                    } else {
                        newContact = {
                            accounts: [{
                                publicKey: bob.publicKey,
                                firstName: null,
                                lastName: null,
                                created: null,
                            }],
                            totalCdms: 0,
                            readCdms: 0,
                            cdm: null,
                        }
                        fullName = bob.publicKey;
                    }
                    
                    bob.fullName = fullName;
                    cdm.list = [];
                    list.splice(1, 0, newContact);
                    return list;
                })
                .then(list => {
                    if (bob.publicKey === null) { return list; }
                    
                    const currentEl = list.filter(el => el.accounts[0].publicKey === bob.publicKey)[0];
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

