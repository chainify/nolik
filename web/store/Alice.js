import { action, observable } from 'mobx';
import axios from 'axios';
import * as WavesAPI from 'waves-api';
import Router from 'next/router';
import stringFromUTF8Array from './../utils/batostr';

class AliceStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        // this.init = this.init.bind(this);
        this.auth = this.auth.bind(this);
        this.authCheck = this.authCheck.bind(this);
    }

    @observable publicKey = null;

    // @action
    // init() {
    //     const { settings } = this.stores;
    //     const Waves = WavesAPI.create(WavesAPI.TESTNET_CONFIG);
    //     const seed = Waves.Seed.fromExistingPhrase(settings.seed);
    //     this.address = seed.address;
    //     this.publicKey = seed.keyPair.publicKey;
    //     this.privateKey = seed.keyPair.privateKey;
    // }

    @action
    auth() {
        const { cdm, bob } = this.stores;
        if (typeof window !== 'undefined') {
            window.Waves.auth({
                name: 'Chainify',
                data: process.env.SECRET,
            }).then(() => {
                window.Waves.publicState().then(data => {
                    this.publicKey = data.account.publicKey; 
                    const bobPublicKey = sessionStorage.getItem('bobPublicKey');
                    if (bobPublicKey) {
                        Router.push(`/index?publicKey=${bobPublicKey}`, `/pk/${bobPublicKey}`);
                    } else {
                        Router.push('/');
                    }
                })
                .catch(e => {
                    console.error(e);
                });
            })
            .catch(e => {
                console.error(e);
            });
        }
    }


    @action
    authCheck() {
        if (typeof window !== 'undefined') {
            try {
                window.Waves.publicState().then(res => {   
                    if (res.locked === true) {
                        this.publicKey = null;
                    } else {
                        if (this.publicKey !== res.account.publicKey) {
                            this.publicKey = res.account.publicKey;
                        }
                    }
                })
                .catch(e => {
                    this.publicKey = null;
                    console.log(e);
                })
            } catch(e) {
                console.log(e);
            } finally {
                if (this.publicKey === null) {
                    Router.push('/login');
                }
            }
        }
    }
}

export default AliceStore;

