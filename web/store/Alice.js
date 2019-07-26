import { action, observable } from 'mobx';
import axios from 'axios';
import Router from 'next/router';
import stringFromUTF8Array from './../utils/batostr';
import { keyPair as wckp } from '@waves/waves-crypto';


class AliceStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.updateHeartbeat = this.updateHeartbeat.bind(this);
        this.auth = this.auth.bind(this);
        this.authCheck = this.authCheck.bind(this);
    }

    @observable publicKey = null;
    @observable updateHeartbeatStatus = 'init';

    @action
    updateHeartbeat() {
        const { utils, groups, cdm } = this.stores;
        if (this.publicKey === null) { return }

        const formConfig = {};
        const formData = new FormData();
        formData.append('publicKey', this.publicKey);
        this.updateHeartbeatStatus = 'penging';
        
        utils.sleep(1000).then(() => {
            axios.post(`${process.env.API_HOST}/api/v1/heartbeat`, formData, formConfig)
                .then(res => {
                    const accounts = res.data.online;
                    const lastCdm = res.data.lastCdm;

                    cdm.lastCdmHash = lastCdm ? lastCdm[0] : null;

                    const distinct = (value, index, self) =>{
                        return self.indexOf(value) ===index;
                    }
                    
                    groups.activeGroups = accounts.map(el => el.groupHash).filter(distinct);
                    groups.activeSenders = accounts.map(el => el.publicKey).filter(distinct);
                    
                    if (groups.list) {
                        for (let i = 0; i < groups.list.length; i += 1) {
                            groups.list[i].isOnline = groups.activeGroups.indexOf(groups.list[i].groupHash) > -1;
                        }
                    }   
                })
                .then(_ => {
                    this.updateHeartbeatStatus = 'success';
                })
                .catch(e => {
                    this.updateHeartbeatStatus = 'error';
                });
        })
    }

    @action
    auth() {
        const { cdm, groups, index, contacts } = this.stores;
        if (typeof window !== 'undefined') {
            try {
                window.Waves.auth({
                    name: 'Nolik',
                    data: process.env.SECRET,
                }).then(() => {
                    window.Waves.publicState().then(data => {
                        this.publicKey = data.account.publicKey; 
                        cdm.list = null;
                        groups.list = null;
                        index.resetNewGroupMember();
                        index.showGroupInfoModal = false;
                        index.showNewGroupMembersModal = false;
                        const groupHash = sessionStorage.getItem('groupHash');
                        cdm.initLevelDB(data.account.publicKey, groupHash || 'none');
                        contacts.initLevelDB();
                        contacts.saveContact(this.publicKey, data.account.name); 
                        Router.push('/');
                    })
                    .catch(e => {
                        console.error(e);
                    });
                })
                .catch(e => {
                    console.error(e);
                });
            } catch(e) {
                if (e.message === 'window.Waves is undefined') {
                    console.log('Keeper needed');
                }
            }
        }
    }


    @action
    authCheck() {
        const { login, groups } = this.stores;
        if (typeof window !== 'undefined') {
            try {
                window.Waves.publicState().then(res => {   
                    if (res.locked === true) {
                        this.publicKey = null;
                    } else {
                        if (this.publicKey !== null && this.publicKey !== res.account.publicKey) {
                            groups.resetGroup();
                            this.publicKey = null;
                        }
                    }
                })
                .catch(e => {
                    groups.resetGroup();
                    this.publicKey = null;
                    console.log(e);
                });
            } catch(e) {                
                if (e.message === 'window.Waves is undefined') {
                    console.log('Keeper needed');
                } else {
                    console.log(e);
                }
            } finally {
                if (this.publicKey === null) {
                    groups.resetGroup();
                    Router.push('/login');
                }
            }
        }
    }
}

export default AliceStore;

