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
        const { cdms, threads, index, contacts } = this.stores;
        if (typeof window !== 'undefined') {
            try {
                window.Waves.auth({
                    name: 'Nolik',
                    data: KEEPER_SECRET,
                }).then(_ => {
                    window.Waves.publicState().then(data => {
                        this.publicKey = data.account.publicKey; 
                        threads.resetThread();
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
        const { compose, threads } = this.stores;
        if (typeof window !== 'undefined') {
            try {
                window.Waves.publicState().then(res => {   
                    if (res.locked === true) {
                        this.publicKey = null;
                    } else {
                        if (this.publicKey !== null && this.publicKey !== res.account.publicKey) {
                            threads.resetThread();
                            this.publicKey = null;
                        }
                    }
                })
                .catch(e => {
                    threads.resetThread();
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
                    threads.demolish();
                    Router.push('/login');
                }
            }
        }
    }
}

export default AliceStore;

