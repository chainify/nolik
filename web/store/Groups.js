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
    setGroup(group) {
        const { alice, cdm } = this.stores;
        sessionStorage.setItem('groupHash', group.groupHash);
        this.current = group;
        Router.push(`/index?groupHash=${group.groupHash}`, `/gr/${group.groupHash}`);

        this.setFullName(group.fullName);
        cdm.initLevelDB(alice.publicKey, group.groupHash);
        cdm.getList();
    }

    @action
    resetGroup() {
        const { cdm } = this.stores;
        this.fullName = null;
        this.current = null;
        cdm.list = null;
        sessionStorage.removeItem('groupHash');
        Router.push('/');
    }

    @action
    setFullName(fullName) {
        this.fullName =  fullName.length > 20 ? fullName.substring(0, 20) + '...' : fullName;
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
                        const listEl = list[i];
                        listEl.readCdms = 0;
                        const p = cdm.readCdmDB.get(groupHash)
                            .then(res => {
                                listEl.readCdms = parseInt(stringFromUTF8Array(res));
                                return listEl;
                            })
                            .catch(e => {
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
                        .filter(el => (
                            el.fullName.toLowerCase().search(this.searchValue.toLowerCase()) > -1 ||
                            el.members.filter(m => m.publicKey === this.searchValue).length > 0
                        ));
                    
                    if (filtered.length === 0 && this.searchValue.length === 44) {
                        const groupHash = this.createGroupHash([alice.publicKey, this.searchValue])
                        return filtered.concat([{
                            members: [{
                                publicKey: this.searchValue,
                                lastActive: null,
                            }],
                            index: list.length,
                            groupHash: groupHash,
                            fullName: 'NEW:' + groupHash,
                            totalCdms: 0,
                            lastCdm: null,
                        }])
                    } else {
                        return filtered;
                    }
                })
                .then(list => {
                    if (this.current === null) { return list }
                    const localCurrent = list.filter(el => el.groupHash === this.current.groupHash)[0];
                    if (localCurrent.totalCdms !== this.current.totalCdms) {
                        cdm.getList();
                        this.current = localCurrent;
                    }
                    return list;
                })
                .then(list => {
                    if (this.current === null) { return list }
                    const filtered = list.filter(el => el.groupHash === this.current.groupHash);
                    if (filtered.length === 0) {this.resetGroup() }
                    return list;
                })
                .then(list => {
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
                        // list[i].lastCdm.message = <ReactMarkdown source={res} skipHtml={true} />;
                        const regex = /[\w\s\ud83d\ude00-\ude4f]/gm;
                        let m;
                        let msg = '';
                        while ((m = regex.exec(res)) !== null) {
                            // This is necessary to avoid infinite loops with zero-width matches
                            if (m.index === regex.lastIndex) {
                                regex.lastIndex++;
                            }
                            msg += m[0];
                        }

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

