import { action, observable } from 'mobx';
import axios from 'axios';
import Router from 'next/router';
import stringFromUTF8Array from './../utils/batostr';
import { keyPair as wckp } from '@waves/waves-crypto';


class AliceStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.auth = this.auth.bind(this);
        this.authCheck = this.authCheck.bind(this);
        this.logOut = this.logOut.bind(this);
    }

    @observable publicKey = null;

    @action
    logOut() {
        this.publicKey = null;
    }

    @action
    auth() {
        const { cdms, groups, index, contacts } = this.stores;
        if (typeof window !== 'undefined') {
            try {
                window.Waves.auth({
                    name: 'Nolik',
                    data: process.env.SECRET,
                }).then(() => {
                    window.Waves.publicState().then(data => {
                        this.publicKey = data.account.publicKey; 
                        groups.resetGroup();
                        // cdms.list = null;
                        // groups.list = null;
                        // index.resetNewGroupMember();
                        // index.showGroupInfoModal = false;
                        // index.showNewGroupMembersModal = false;
                        // const groupHash = sessionStorage.getItem('groupHash');
                        // cdms.initLevelDB(data.account.publicKey, groupHash || 'none');
                        // contacts.initLevelDB();
                        // contacts.saveContact(this.publicKey, data.account.name); 
                        // 
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
        const { compose, groups } = this.stores;
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
                    compose.resetCompose();
                    Router.push('/login');
                }
            }
        }
    }
}

export default AliceStore;

