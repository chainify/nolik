import { action, observable, toJS } from 'mobx';
import axios from 'axios';
import Router from 'next/router';
import { sha256 } from 'js-sha256';
import stringFromUTF8Array from './../utils/batostr';
const ReactMarkdown = require('react-markdown');

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
    @observable current = null;
    @observable newGroups = [];
    @observable fullName = null;
    @observable getListStatus = 'init';
    @observable searchValue = '';
    @observable searchedList = null;
    @observable initLoadingStatus = null;

    @observable activeGroups = [];
    @observable activeSenders = [];

    @action
    createGroupHash(publicKeys) {
        const sorted = publicKeys.sort().join('');
        return sha256(sorted);
    }

    @action
    setGroup(group) {
        const { alice, cdm } = this.stores;
        sessionStorage.setItem('groupHash', group.groupHash);
        const groupsWithSameGroupHash = this.list.filter(el => el.groupHash === group.groupHash);
        if (groupsWithSameGroupHash.length > 0) {
            const sameGroup = groupsWithSameGroupHash[0];
            this.current = sameGroup;
            this.setGroupFullName(sameGroup.fullName);
        } else {
            this.current = group;
            this.setGroupFullName(group.fullName);
        }

        Router.push(`/index?groupHash=${group.groupHash}`, `/gr/${group.groupHash}`);
        cdm.initLevelDB(alice.publicKey, group.groupHash);
        cdm.getList();        
    }

    @action
    resetGroup() {
        const { cdm } = this.stores;
        this.fullName = null;
        this.current = null;
        this.newGroups = [];
        this.searchedList = null;
        this.searchValue = '';
        cdm.list = null;
        cdm.message = '';
        sessionStorage.removeItem('groupHash');
        Router.push('/');
    }

    @action
    setGroupFullName(fullName) {
        this.fullName = fullName.length > 20 ? fullName.substring(0, 20) + '...' : fullName;
    }

    @action
    getList() {
        const { alice, cdm, contacts } = this.stores;
        const formConfig = {}

        this.getListStatus = 'fetching';
        this.initLoadingStatus = 'Loading...'
        axios
            .get(`${process.env.API_HOST}/api/v1/groups/${alice.publicKey}`, formConfig)
            .then(res => {
                this.initLoadingStatus = 'Decrypting data...';
                return this.decryptList(res.data.groups);
            })
            .then(list => {
                const promises = [];
                for (let i = 0; i < list.length; i += 1) {
                    const groupHash = list[i].groupHash;
                    const listEl = list[i];
                    listEl.readCdms = 0;
                    const p = cdm.readCdmDB.get(groupHash)
                        .then(res => {
                            listEl.isOnline = this.activeGroups.indexOf(listEl.groupHash) > -1;
                            const readCdms = parseInt(stringFromUTF8Array(res)) || 0;
                            listEl.readCdms = listEl.totalCdms < readCdms ? list.totalCdms : readCdms;
                            return listEl;
                        })
                        .catch(e => {
                            return listEl;
                        });
                    promises.push(p);
                }
                return Promise.all(promises)
                    .then(res => {       
                        return res;
                    });
            })
            .then(list => {
                const promises = [];
                for (let i = 0; i < list.length; i += 1) {
                    const listEl = list[i];
                    const members = listEl.members.filter(member => member !== alice.publicKey);
                    if (members.length === 1 && listEl.index > 1) {
                        const p = contacts.getContact(members[0])
                            .then(contactFullName => {
                                listEl.fullName = contactFullName ? contactFullName : listEl.fullName;
                                return listEl;
                            })
                            .catch(e => {
                                console.log('e', e);
                            });
                        promises.push(p);                            
                    } else {
                        const p = contacts.getContact(listEl.groupHash)
                            .then(groupFullName => {
                                listEl.fullName = groupFullName ? groupFullName : listEl.fullName;
                                return listEl;
                            })
                            .catch(e => {
                                console.log('e', e);
                            });
                        promises.push(p);                            
                    }
                }
                
                return Promise.all(promises)
                    .then(res => {
                        return res;
                    });
            })
            .then(list => { 
                const newGroupHashes = this.newGroups.map(el => el.groupHash);
                if (this.newGroups.length > 0 && list.filter(el => newGroupHashes.indexOf(el.groupHash) > -1).length === 0) {
                    const withNewGroups = list.slice(0,2).concat(this.newGroups).concat(list.slice(2));
                    return withNewGroups;
                } else {
                    return list;
                }
            })
            .then(list => {
                if (this.current === null) { return list }
                const localCurrent = list.filter(el => el.groupHash === this.current.groupHash);                    
                if (localCurrent.length > 0 && localCurrent[0].totalCdms !== this.current.totalCdms) {
                    cdm.getList();
                    this.current = localCurrent[0];
                }
                return list;
            })
            .then(list => {
                if (this.searchedList && this.searchedList.length === 1) {
                    if (list.filter(el => el.groupHash === this.searchedList[0].groupHash).length > 0) {
                        this.searchedList = null;
                    }
                }
                return list;
            })
            .then(list => {
                this.list = list;
                this.getListStatus = 'success';
            })
            .catch(e => {
                this.getListStatus = 'error';
            });
    }

    @action
    decryptList(list, clearHash = true) {
        const { alice, crypto } = this.stores;
        const decList = [];
        const promises = [];
        for (let i = 0; i < list.length; i += 1) {
            if (list[i].lastCdm) {
                const p = crypto.decryptMessage(list[i].lastCdm.message, list[i].lastCdm.logicalSender, clearHash)
                    .then(res => {
                        list[i].lastCdm.message = <ReactMarkdown source={res} skipHtml={true} />;
                        let msg = res;
                        msg = msg.replace(/[`*]/gm, '');

                        list[i].lastCdm.message = msg;
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

