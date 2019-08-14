import { action, observable, toJS } from 'mobx';
import axios from 'axios';
import Router from 'next/router';
import { sha256 } from 'js-sha256';
import stringFromUTF8Array from '../utils/batostr';

class ThreadsStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        // this.getList = this.getList.bind(this);
        this.toggleShowThreadInfo = this.toggleShowThreadInfo.bind(this);
    }

    @observable list = null;
    @observable current = null;
    @observable search = '';

    @observable showThreadInfo = true;

    @observable appDB = null;
    @observable listDB = null;
    @observable namesDB = null;
    @observable fakeThreads = [0, 1, 2, 3, 4, 5, 6];

    @action
    initLevelDB() {
        const { alice } = this.stores;
        const levelup = require('levelup');
        const leveljs = require('level-js');

        if (alice.publicKey) {
            this.appDB = levelup(leveljs(`/root/.leveldb/app_${alice.publicKey}`));
            this.listDB = levelup(leveljs(`/root/.leveldb/list_threads_${alice.publicKey}`));
            this.namesDB = levelup(leveljs(`/root/.leveldb/list_threads_names_${alice.publicKey}`));
        }
    }

    @action
    createThreadHash(publicKeys) {
        const sorted = publicKeys.sort().join('');
        return sha256(sorted);
    }

    @action
    toggleShowThreadInfo() {
        this.showThreadInfo = !this.showThreadInfo;
    }


    @action
    setThread(thread) {
        const { compose } = this.stores;
        this.current = thread;

        compose.resetCompose();
        Router.push(`/index?threadHash=${thread.threadHash}`, `/gr/${thread.threadHash}`);
    }

    @action
    resetThread() {
        const { compose } = this.stores;
        this.current = null;
        this.search = '';
        compose.resetCompose();
        Router.push('/');
    }

    @action
    demolish() {
        const { heartbeat } = this.stores;
        this.list = null;
        heartbeat.lastTxId = null;
        this.resetThread();
    }

    @action
    setAppSettings(key, value) {
        this.appDB.put(key, value);
    }

    @action
    getAppSettings(key) {
        return new Promise((resolve, reject) => {
            this.appDB.get(key)
                .then(res => {
                    resolve(stringFromUTF8Array(res));
                })
                .catch(e => {
                    if (e.name === 'NotFoundError') {
                        resolve(null);
                    } else {
                        reject(e);
                    }
                });
        })
    }

    @action
    dropList() {
        const { notifiers, heartbeat } = this.stores;
        this.listDB.createReadStream()
            .on('data', data => {
                const k = parseInt(stringFromUTF8Array(data.key));
                this.listDB.del(k);
            })
            .on('end', _ => {
                this.list = [];
                heartbeat.lastTxId = null;
                notifiers.info('Cache has been cleared');
            });
    }
    
    @action
    readList() {
        const promises = [];
        this.listDB.createReadStream()
            .on('data', data => {
                const k = parseInt(stringFromUTF8Array(data.key));
                const v = stringFromUTF8Array(data.value);

                const item = JSON.parse(v);
                const p = this.decrypItem(item).then(res => {
                    return res;
                })
                promises.push(p);
            })
            .on('end', _ => {
                Promise.all(promises).then(list => {
                    console.log('read', list);
                    this.list = list.reverse();
                })
            });
    }


    @action
    updateList(list) {
        const hashes = this.list ? this.list.map(el => el.threadHash) : [];
        const indexesToDelete = [];
        const promises = [];
        let current = null;
        for (let i = 0; i < list.length; i += 1) {
            const item = list[i];
            const index = hashes.indexOf(item.threadHash);

            if (index > -1) {
                indexesToDelete.push(index);
            }

            if (this.current && this.current.threadHash === item.threadHash ) {
               current = item; 
            }

            const p = this.decrypItem(item).then(res => {
                return res;
            })
            promises.push(p);
        }

        Promise.all(promises).then(decLIst => {
            const sorted = indexesToDelete.sort().reverse();
            for (let i = 0; i < sorted.length; i += 1) {
                this.list.splice(sorted[i], 1);
            }
            const newList = decLIst.reverse().concat(this.list);
            console.log('decLIst', decLIst);
            
            this.list = newList;

            if (current) {
                this.setThread(current);
            }
        });
    }


    @action
    decrypItem(item) {
        return new Promise((resolve, reject) => {
            const promises = [];
            const cdms = [];
            for (let j = 0; j < item.cdms.length; j += 1) {
                const p = this.decryptCdm(item.cdms[j]).then(cdm => {
                    cdms.push(cdm);
                });
                promises.push(p);
            }

            Promise.all(promises).then(_ => {
                item.cdms = cdms;
                resolve(item);
            });
        });
    }


    @action
    decryptCdm(cdm) {

        const { crypto } = this.stores;
        return new Promise((resolve, reject) =>  {
            const promises = [];
        
            if (cdm.subject) {
                const subject = crypto.decryptMessage(
                    cdm.subject,
                    cdm.direction === 'outgoing' ? cdm.recipient : cdm.logicalSender
                )
                .then(res => {
                    cdm.rawSubject = res;
                    cdm.subject = res.replace(/@[\w]{64}$/gmi, "").replace(/[`*]/gm, '');
                });
                promises.push(subject);
            }

            if (cdm.message) {
                const message = crypto.decryptMessage(
                    cdm.message,
                    cdm.direction === 'outgoing' ? cdm.recipient : cdm.logicalSender
                )
                .then(res => {
                    cdm.rawMessage = res;
                    cdm.message = res.replace(/@[\w]{64}$/gmi, "").replace(/[`*]/gm, '');
                });
                promises.push(message);
            }
    
            Promise.all(promises)
                .then(_ => resolve(cdm))
                .catch(e => reject(e));
        })
        
    }


    @action
    saveList(list) {
        const records = [];
        this.listDB.createReadStream()
            .on('data', data => {
                const k = parseInt(stringFromUTF8Array(data.key));
                const v = stringFromUTF8Array(data.value);
                records.push({
                    key: k,
                    value: JSON.parse(v)
                });
            })
            .on('end', _ => {
                const operations = [];
                const newThreadHahses = list.map(el => el.threadHash);
                
                for (let i = 0; i < records.length; i += 1) {
                    if (newThreadHahses.indexOf(records[i].value.threadHash) > -1) {
                        operations.push({
                            type: 'del',
                            key: records[i].key
                        });
                    }
                }

                const initKey = records.length > 0 ? records[records.length - 1].key + 1 : 0
                for (let i = 0; i < list.length; i += 1) {
                    operations.push(
                        {
                            type: 'put',
                            key: i + initKey,
                            value: JSON.stringify(list[i])
                        },
                    );
                }
                
                this.listDB.batch(operations, err => {
                    if (err) return console.log('Batch insert error', err);
                    this.updateList(list);
                });
            });
    }
}

export default ThreadsStore;

