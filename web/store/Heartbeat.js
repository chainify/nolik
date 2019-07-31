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

    @action
    push() {
        const { utils, groups, cdms } = this.stores;
        if (this.publicKey === null) { return }
        
        const formConfig = {};
        const formData = new FormData();
        formData.append('publicKey', this.publicKey);
        formData.append('lastTimestamp', groups.lastTimestamp);
        
        utils.sleep(this.pushStatus === 'init' ? 0 : 1000).then(() => {
            this.pushStatus = 'pending';
            axios.post(`${process.env.API_HOST}/api/v1/heartbeat`, formData, formConfig)
                .then(res => {
                    const list = res.data.groups;
                    if (list.length > 0) {
                        groups.saveGroups(res.data.groups);
                    }
                    
                    // const accounts = res.data.online;
                    // const lastCdm = res.data.lastCdm;

                    // cdms.lastCdmHash = lastCdm ? lastCdm[0] : null;

                    // const distinct = (value, index, self) =>{
                    //     return self.indexOf(value) ===index;
                    // }
                    
                    // groups.activeGroups = accounts.map(el => el.groupHash).filter(distinct);
                    // groups.activeSenders = accounts.map(el => el.publicKey).filter(distinct);
                    
                    // if (groups.list) {
                    //     for (let i = 0; i < groups.list.length; i += 1) {
                    //         groups.list[i].isOnline = groups.activeGroups.indexOf(groups.list[i].groupHash) > -1;
                    //     }
                    // }   
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

