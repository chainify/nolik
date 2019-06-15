import { action, observable, toJS } from 'mobx';
import axios from 'axios';
import Router from 'next/router';
import { sha256 } from 'js-sha256';
import stringFromUTF8Array from './../utils/batostr';

class GroupsStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.getList = this.getList.bind(this);
        this.decryptList = this.decryptList.bind(this);
    }

    @observable publicKey = null;
    @observable groupHash = null;
    @observable list = [];
    @observable newGroupMembers = null;
    @observable fullName = null;
    @observable getListStatus = 'init';


    @action
    createGroupHash(publicKeys) {
        const sorted = publicKeys.sort();
        return sha256(sorted);
    }

    @action
    setGroup(groupHash) {
        const { alice, cdm } = this.stores;
        sessionStorage.setItem('groupHash', groupHash);
        this.groupHash = groupHash;
        Router.push(`/index?groupHash=${groupHash}`, `/gr/${groupHash}`);

        this.setFullName(groupHash);
        cdm.initLevelDB(alice.publicKey, groupHash);
        cdm.getList();
    }

    @action
    resetGroup() {
        const { cdm } = this.stores;
        this.groupHash = null;
        this.fullName = null;
        cdm.list = [];
        sessionStorage.removeItem('groupHash');
        Router.push('/');
    }

    @action
    currentGroup() {
        const currentGroup = this.list.filter(el => el.groupHash === this.groupHash);
        return currentGroup.length > 0 ? currentGroup[0] : null;
    }

    @action
    setFullName(groupHash) {
        const { contacts } = this.stores;

        contacts.getContact(groupHash)
            .then(contact => {
                this.fullName = contact ? contact : groupHash;
            })
            .catch(e => {
                console.log('e', e);
            });
    }

    @action
    getList() {
        const { alice, utils, cdm, contacts } = this.stores;
        const formConfig = {}
 
        this.getListStatus = 'fetching';
        utils.sleep(this.list ? 400 : 0).then(() => {
            axios
                .get(`${process.env.API_HOST}/api/v1/groups/${alice.publicKey}`, formConfig)
                .then(res => {
                    return this.decryptList(res.data.groups);
                })
                .then(list => {
                    const promises = [];
                    for (let i = 0; i < list.length; i += 1) {
                        const groupHash = list[i].groupHash;
                        if (cdm.readCdmDB === null) {
                            cdm.initLevelDB(alice.publicKey, groupHash)
                        }
                        const listEl = list[i];
                        listEl.readCdms = 0;
                        const p = cdm.readCdmDB.get(groupHash)
                            .then(res => {
                                listEl.readCdms = parseInt(stringFromUTF8Array(res));
                                return listEl;
                            });
                        promises.push(p);
                    }
                    return Promise.all(promises)
                        .then(res => {
                            return res
                        });
                })
                .then(list => {
                    const { contacts } = this.stores;
                    const currentGroup = this.currentGroup();
                    if (currentGroup === null) { return list }
                    if (this.groupHash === null) { return list }
                //     const contact = contacts.getContact(this.groupHash);

                //     let newContact = null;
                // //     if (contact.length > 0) {
                // //         newContact = {
                // //             accounts: [{
                // //                 publicKey: this.publicKey,
                // //                 firstName: contact[0].firstName,
                // //                 lastName: contact[0].lastName,
                // //                 created: contact[0].created,
                // //             }],
                // //             totalCdms: 0,
                // //             readCdms: 0,
                // //             cdm: null,
                // //         }
                // //     } else {
                // //         newContact = {
                // //             accounts: [{
                // //                 publicKey: this.publicKey,
                // //                 firstName: null,
                // //                 lastName: null,
                // //                 created: null,
                // //             }],
                // //             totalCdms: 0,
                // //             readCdms: 0,
                // //             cdm: null,
                // //         }
                // //     }
                    
                // //     cdm.list = [];
                //     // list.splice(1, 0, newContact);
                    return list;
                })
                .then(list => {
                    if (this.groupHash === null) { return list }
                    const currentGroup = this.currentGroup();
                    if (currentGroup === null) { return list }
                    const pending = cdm.list.filter(el => el.type === 'pending');
                    if (currentGroup.totalCdms > cdm.list.length - pending.length) {
                        cdm.getList();
                    }
                    return list;
                })
                .then(list => {
                    this.list = list;
                    this.getListStatus = 'success';
                })
                .catch(e => {
                    // console.log(e);
                    this.getListStatus = 'error';
                })
        });
    }

    @action
    decryptList(list) {
        const { alice, crypto } = this.stores;
        const decList = [];
        const promises = [];
        for (let i = 0; i < list.length; i += 1) {
            if (list[i].lastCdm) {
                // const recipients = list[i].members.filter(el => el.publicKey !== alice.publicKey);
                const p = crypto.decryptMessage(list[i].lastCdm.message, list[i].members[0].publicKey)
                    .then(res => {
                        list[i].lastCdm.message = res;
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

export default GroupsStore;

