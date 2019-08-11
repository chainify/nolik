import { action, observable } from 'mobx';
import Router from 'next/router';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { KEEPER_SECRET } = publicRuntimeConfig;

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
                    data: KEEPER_SECRET,
                }).then(() => {
                    window.Waves.publicState().then(data => {
                        this.publicKey = data.account.publicKey; 
                        groups.resetGroup();
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
                    compose.resetCompose();
                    groups.demolish();
                    Router.push('/login');
                }
            }
        }
    }
}

export default AliceStore;

