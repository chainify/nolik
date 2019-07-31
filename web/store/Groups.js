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
        // this.getList = this.getList.bind(this);
        this.decryptList = this.decryptList.bind(this);
    }

    @observable list = null;
    @observable current = null;
    // @observable getListStatus = 'init';
    @observable search = '';
    @observable lastTimestamp = null;

    @observable listDB = null;
    @observable namesDB = null;
    @observable fakeGroups = [0, 1, 2, 3, 4, 5, 6];

    @action
    initLevelDB() {
        const { alice } = this.stores;
        const levelup = require('levelup');
        const leveljs = require('level-js');

        this.listDB = levelup(leveljs(`/root/.leveldb/list_groups_${alice.publicKey}`));
        this.namesDB = levelup(leveljs(`/root/.leveldb/list_groups_names_${alice.publicKey}`));
        // this.testDB = levelup(leveljs(`/root/.leveldb/test_${alice.publicKey}`));

        // this.testDB.put(0, 'string');
        // this.testDB.put(1, 12345);
        // this.testDB.put(2, JSON.stringify({a: 'a', b: 123, c: true}));

        // const records = [];  
        // this.testDB.createReadStream()
        //     .on('data', data => {
        //         const k = parseInt(stringFromUTF8Array(data.key));
        //         const v = stringFromUTF8Array(data.value);
        //         // this.testDB.del(k);
        //         records.push({
        //             key: k,
        //             value: v
        //         });
        //     })
        //     .on('end', _ => {
        //         const operations = []
        //         const firstRecordKey = records.length > 1 && records[0].key;

        //         for (let i = 0; i < records.length; i += 1) {
        //             operations.push(
        //                 {
        //                     type: 'del',
        //                     key: records[i].key
        //                 },
        //                 {
        //                     type: 'put',
        //                     key: firstRecordKey > records.length ? i : records[i].key + records.length,
        //                     value: records[i].value
        //                 }
        //             )
        //         }
        //         this.testDB.batch(operations, err => {
        //             if (err) return console.log('Batch insert error', err);
        //         })
        //     });
    }

    @action
    createGroupHash(publicKeys) {
        const sorted = publicKeys.sort().join('');
        return sha256(sorted);
    }


    @action
    setGroup(group) {
        const { alice, cdms } = this.stores;

        return;
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
        cdms.initLevelDB(alice.publicKey, group.groupHash);
        cdms.getList();        
    }

    @action
    resetGroup() {
        this.list = null;
        this.current = null;
        this.lastTimestamp = null;
        this.search = '';
        Router.push('/');
        // cdms.list = null;
        // cdms.message = '';
    }

    // @action
    // getList() {
    //     const { alice, cdms, contacts } = this.stores;
    //     const formConfig = {}

    //     this.getListStatus = 'fetching';
    //     axios
    //         .get(`${process.env.API_HOST}/api/v1/groups/${alice.publicKey}?lastTimestamp=${this.lastTimestamp}`, formConfig)
    //         .then(res => {
    //             this.saveGroups(res.data.groups);
    //         })
    //         .catch(e => {
    //             this.getListStatus = 'error';
    //         });
    // }


    @action
    readGroups() {
        const list = [];
        this.listDB.createReadStream()
            .on('data', data => {
                const k = parseInt(stringFromUTF8Array(data.key));
                const v = stringFromUTF8Array(data.value);
                list.push({
                    key: k,
                    value: JSON.parse(v)
                });
            })
            .on('end', _ => {
                console.log('list', list);
                this.list = list;
            });
    }


    @action
    saveGroups(list) {
        const records = [];
        this.listDB.createReadStream()
            .on('data', data => {
                const k = parseInt(stringFromUTF8Array(data.key));
                const v = stringFromUTF8Array(data.value);
                records.push({
                    key: k,
                    value: v
                });
            })
            .on('end', _ => {
                const operations = list.map((el, index) => {
                    return {
                        type: 'put',
                        key: index,
                        value: JSON.stringify(el)
                    }
                });

                const firstRecordKey = records.length > 1 && records[0].key || 0;
                for (let i = operations.length; i < records.length + operations.length; i += 1) {
                    operations.push(
                        {
                            type: 'del',
                            key: records[i].key
                        },
                        {
                            type: 'put',
                            key: firstRecordKey > records.length + operations.length ? i : records[i].key + records.length,
                            value: records[i].value
                        }
                    )
                }
                const now = Date.now() / 1000 | 0;
                this.lastTimestamp = list.length > 0 && list[0].lastCdm ? list[0].lastCdm.timestamp : now;
                
                console.log('operations', operations);
                
                // this.listDB.batch(operations, err => {
                //     if (err) return console.log('Batch insert error', err);
                //     if (list[0].lastCdm) {
                //         this.lastTimestamp = list[0].lastCdm.timestamp;
                //         console.log(this.lastTimestamp);
                //     }
                // })
            });
    }

    @action
    decryptList(list) {
        const { crypto } = this.stores;
        const decList = [];
        const promises = [];
        for (let i = 0; i < list.length; i += 1) {
            if (list[i].lastCdm) {
                const p = crypto.decryptMessage(list[i].lastCdm.message, list[i].lastCdm.logicalSender)
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

