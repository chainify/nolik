import { action, observable, toJS } from 'mobx';
import axios from 'axios';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;

class HeartbeatStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.push = this.push.bind(this);
    }

    @observable pushStatus = 'init';
    @observable lastTxId = null;

    @action
    push() {
        const { utils, threads, alice } = this.stores;
        const formConfig = {};

        if (
            threads.list &&
            threads.list.length > 0 &&
            this.lastTxId === null
        ) {
            this.lastTxId = threads.list[0].cdms[0].txId;
        }
        
        
        const formData = new FormData();
        formData.append('publicKey', alice.publicKey);
        if (this.lastTxId) {
            formData.append('lastTxId', this.lastTxId);
        }
        
        utils.sleep(this.pushStatus === 'init' ? 0 : 1000).then(() => {
            this.pushStatus = 'pending';
            axios.post(`${API_HOST}/api/v1/heartbeat`, formData, formConfig)
                .then(res => {
                    const listThreads = res.data.threads;
                    if (listThreads.length > 0) {
                        const lastThreadCdms = listThreads[listThreads.length - 1].cdms;
                        const lastTxId = lastThreadCdms[0].txId;

                        console.log(this.lastTxId, lastTxId);
                        

                        if (this.lastTxId !== lastTxId) {
                            threads.saveList(listThreads);
                            this.lastTxId = lastTxId;
                        }
                    }
                })
                .then(_ => {
                    this.pushStatus = 'success';
                })
                .catch(e => {
                    this.pushStatus = 'error';
                });
        })
    }

}

export default HeartbeatStore;

