import { action, observable } from 'mobx';
import axios from 'axios';
import Router from 'next/router';
import stringFromUTF8Array from '../utils/batostr';
import { keyPair as wckp } from '@waves/waves-crypto';


class HeartbeatStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.push = this.push.bind(this);
    }

    @observable pushStatus = 'init';
    @observable lastCdmHash = null;

    @action
    push() {
        const { utils, groups, cdms, alice } = this.stores;
        if (this.publicKey === null) { return }
        
        const formConfig = {};
        const formData = new FormData();
        formData.append('publicKey', alice.publicKey);
        if (groups.lastTxId) {
            formData.append('lastTxId', groups.lastTxId);
        }
        
        utils.sleep(this.pushStatus === 'init' ? 0 : 1000).then(() => {
            this.pushStatus = 'pending';
            axios.post(`${process.env.API_HOST}/api/v1/heartbeat`, formData, formConfig)
                .then(res => {
                    const listGroups = res.data.groups;
                    const listCdms = res.data.cdms;
                    if (
                        listGroups.length > 0 &&
                        listGroups[listGroups.length - 1].lastCdm.txId !== groups.lastTxId
                    ) {
                        cdms.saveList(listCdms);
                        groups.saveList(listGroups);
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

