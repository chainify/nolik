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
    @observable list = null;
    @observable newGroupMembers = [];
    @observable fullName = null;
    @observable getListStatus = 'init';
    @observable searchValue = '';

    @action
    createGroupHash(publicKeys) {
        const sorted = publicKeys.sort();
        return sha256(sorted);
    }

    @action
    setGroup(groupHash) {
        console.log('GROUP SETTING');
        
        const { alice, cdm } = this.stores;
        sessionStorage.setItem('groupHash', groupHash);
        this.groupHash = groupHash;
        Router.push(`/index?groupHash=${groupHash}`, `/gr/${groupHash}`);

        this.setFullName(groupHash);
        cdm.initLevelDB(alice.publicKey, groupHash);
        // cdm.getList();
    }

    @action
    resetGroup() {
        const { cdm } = this.stores;
        this.groupHash = null;
        this.fullName = null;
        cdm.list = null;
        sessionStorage.removeItem('groupHash');
        Router.push('/');
    }

    @action
    currentGroup() {
        const currentGroup = this.list && this.list.filter(el => el.groupHash === this.groupHash);
        if (!currentGroup) { return null }
        return currentGroup.length > 0 ? currentGroup[0] : null;
    }

    @action
    setFullName(groupHash) {
        const { contacts } = this.stores;

        contacts.getContact(groupHash)
            .then(contact => {
                this.fullName = contact ? contact.length > 20 ? contact.substring(0, 20) + '...' : contact : groupHash.substring(0, 20) + '...';
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
                    const promises = [];
                    for (let i = 0; i < list.length; i += 1) {
                        const listEl = list[i];
                        contacts.getContact(listEl.groupHash);
                        const p = contacts.getContact(listEl.groupHash)
                            .then(contact => {
                                listEl.fullName = contact ? contact : listEl.fullName;
                                return listEl;
                            })
                            .catch(e => {
                                console.log('e', e);
                            });
                        promises.push(p);
                    }
                    
                    return Promise.all(promises)
                        .then(res => {
                            return res;
                        });
                })
                .then(list => {
                    const filtered = list
                        .filter(el => el.fullName.toLowerCase().search(this.searchValue.toLowerCase()) > -1);
                    return filtered;
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
                    if (this.searchValue.length === 44) {
                        const groupHash = this.createGroupHash([alice.publicKey, this.searchValue])
                        return [{
                            members: [{
                                publicKey: this.searchValue,
                                lastActive: null,
                            }],
                            index: 0,
                            groupHash: groupHash,
                            fullName: 'NEW:' + groupHash,
                            totalCdms: 0,
                            lastCdm: null,
                        }]
                    } else {
                        return list;
                    }
                })
                .then(list => {
                    if (this.groupHash === null) { return list }
                    const filtered = list.filter(el => el.groupHash === this.groupHash);
                    if (filtered.length === 0) { this.resetGroup() }
                    return list;
                })
                .then(list => {
                    console.log('SUCCESS GET LIST');
                    
                    this.list = list;
                    this.getListStatus = 'success';
                })
                .catch(e => {
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

