import { action, observable } from 'mobx';
import axios from 'axios';
// import { encrypt, decrypt } from '../utils/cipherUtils';
import { getSharedKey, encryptMessage, signBytes, verifySignature } from '@waves/waves-crypto';
import base58 from './../utils/base58';
import { sha256 } from 'js-sha256';



class CryptoStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.encryptMessage = this.encryptMessage.bind(this);
        this.decryptMessage = this.decryptMessage.bind(this);
    }

    @action
    encryptMessage(recipients) {
        const { cdm, alice, settings } = this.stores;
        return new Promise((resolve, reject) => {            
            if (typeof window !== 'undefined') {
                const sha = sha256(cdm.message);
                const signature = signBytes(Buffer.from(sha), settings.seed);

                const promises = [];
                let msg = '';
                msg += '-----BEGIN_BLOCKCHAIN WAVES-----';

                for( let i = 0; i < recipients.length; i += 1) {
                    const recipientPublicKey = recipients[i];
                    const p = window.Waves
                        .encryptMessage(cdm.message, recipientPublicKey, 'chainify')
                        .then(emcMsg => {
                            msg += `\n-----BEGIN_PUBLIC_KEY ${recipientPublicKey}-----\n${emcMsg}\n-----END_PUBLIC_KEY ${recipientPublicKey}-----`;
                            msg += `\n-----BEGIN_SHA256 ${recipientPublicKey}-----\n${sha}\n-----END_SHA256 ${recipientPublicKey}-----`;
                        });
                    promises.push(p);
                }

                Promise.all(promises)
                    .then(_ => {
                        msg += `\n-----BEGIN_SIGNATURE ${alice.publicKey}-----\n${signature}\n-----END_SIGNATURE ${alice.publicKey}-----`;
                        msg += '\n-----END_BLOCKCHAIN WAVES-----';
                        resolve(msg);
                    })
                    .catch(e => {
                        reject(e);
                    });
            }
        });
    }


    @action
    decryptMessage(cypherText, publicKey) {
        return new Promise((resolve, reject) => {
            if (typeof window !== 'undefined') {
                window.Waves
                    .decryptMessage(cypherText, publicKey, 'chainify')
                    .then(res => {
                        resolve(res);
                    })
                    .catch(e => {
                        console.log(e);
                        resolve('⚠️ Decoding error');
                    });
            }
        })
    }

    @action
    decryptMessageSync(cypherText, address, publicKey) {
        if (typeof window !== 'undefined') {
            const rule = `(?:-----BEGIN ${address}-----)(.*)(?:-----END ${address}-----)`;
            const re = new RegExp(rule, "gms");
            const match = re.exec(cypherText);
            const msg = match[1].trim();
            
            return window.Waves
                .decrypt(msg, publicKey)
                .then(res => {
                    console.log(res);
                    
                    return res;
                })
                .catch(e => {
                    console.log(e);
                });
        }
    }

}

export default CryptoStore;

