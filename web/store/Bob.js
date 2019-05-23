import { action, observable, toJS } from 'mobx';
import axios from 'axios';
import stringFromUTF8Array from './../utils/batostr';

class BobsStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.getList = this.getList.bind(this);
        this.decryptList = this.decryptList.bind(this);
        this.initLevelDB = this.initLevelDB.bind(this);
    }

    @observable publicKey = null;
    @observable list = null;
    @observable data = null;
    @observable newBob = null;
    @observable getListStatus = 'init';
    @observable totalCdmDB = null;

    @observable bobDB = null;

    @action
    initLevelDB() {
        const levelup = require('levelup');
        const leveljs = require('level-js');

        this.totalCdmDB = levelup(leveljs(`/root/.leveldb/total_cdm`));
    }

    @action
    getList() {
        const { alice, bob, utils, cdm } = this.stores;
        const formConfig = {}

        if (alice.publicKey === null) {
            return;
        }
        
        this.getListStatus = 'fetching';
        utils.sleep(this.list ? 1000 : 0).then(() => {
            axios
                .get(`${process.env.API_HOST}/api/v1/interlocutors/${alice.publicKey}`, formConfig)
                .then(res => {
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
                            console.log('EE', e);
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

                    const newContact = {
                        accounts: [{
                            publicKey: bob.publicKey,
                            name: bob.publicKey,
                            created: '',
                        }],
                        totalCdms: 0,
                        readCdms: 0,
                        cdm: null,
                    }

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

