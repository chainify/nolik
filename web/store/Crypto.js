import { action, observable } from 'mobx';
import axios from 'axios';
// import { encrypt, decrypt } from '../utils/cipherUtils';
// import { getSharedKey, encryptMessage, signBytes, verifySignature } from '@waves/waves-crypto';
import { signBytes } from '@waves/waves-crypto';
import base58 from './../utils/base58';
import { sha256 } from 'js-sha256';


class CryptoStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.encryptCdm = this.encryptCdm.bind(this);
        this.decryptMessage = this.decryptMessage.bind(this);
    }

    @action
    encryptCdm(recipients) {
        const { cdm, alice, settings, utils } = this.stores;
        return new Promise((resolve, reject) => {            
            if (typeof window !== 'undefined') {
                const rawMessage = cdm.message.trim();
                const rand = sha256(utils.generateRandom(64));
                const randMessage = rawMessage + '@' + rand;
                
                const sha = sha256(randMessage);
                const signature = signBytes(Buffer.from(sha), settings.seed);
                
                const promises = [];
                let msg = '-----BEGIN_CDM VERSION_1-----';
                msg += '\r\n-----BEGIN_BLOCKCHAIN WAVES-----';

                for( let i = 0; i < recipients.length; i += 1) {
                    const recipientPublicKey = recipients[i];
                    const p = window.Waves
                        .encryptMessage(randMessage, recipientPublicKey, 'chainify')
                        .then(emcMsg => {
                            msg += `\r\n-----BEGIN_PUBLIC_KEY ${recipientPublicKey}-----\r\n${emcMsg}\r\n-----END_PUBLIC_KEY ${recipientPublicKey}-----`;
                            msg += `\r\n-----BEGIN_SHA256 ${recipientPublicKey}-----\r\n${sha}\r\n-----END_SHA256 ${recipientPublicKey}-----`;
                        });
                    promises.push(p);
                }

                Promise.all(promises)
                    .then(_ => {
                        msg += `\r\n-----BEGIN_SIGNATURE ${alice.publicKey}-----\r\n${signature}\r\n-----END_SIGNATURE ${alice.publicKey}-----`;
                        msg += '\r\n-----END_BLOCKCHAIN WAVES-----';
                        msg += '\r\n-----END_CDM VERSION_1-----';
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
                        resolve(res.replace(/@[\w]{64}$/gmi, ""));
                    })
                    .catch(e => {
                        console.log(e);
                        resolve('⚠️ Decoding error');
                    });
            }
        })
    }
}

export default CryptoStore;

