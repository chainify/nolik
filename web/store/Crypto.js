import { action } from 'mobx';
import { signBytes, verifySignature } from '@waves/waves-crypto';
import { sha256 } from 'js-sha256';
import base58 from '../utils/base58';


class CryptoStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.wrapCdm = this.wrapCdm.bind(this);
        this.encryptCdm = this.encryptCdm.bind(this);
        this.decryptMessage = this.decryptMessage.bind(this);
        this.generateForwardCdm = this.generateForwardCdm.bind(this);
    }

    @action
    wrapCdm(msg) {          
        let cdm = '-----BEGIN_CDM VERSION_2-----';
        cdm += '\r\n-----BEGIN_BLOCKCHAIN WAVES-----';
        cdm += msg;
        cdm += '\r\n-----END_BLOCKCHAIN WAVES-----';
        cdm += '\r\n-----END_CDM VERSION_1-----';
        return cdm;
        // cdm += `\r\n-----BEGIN_SIGNATURE ${alice.publicKey}-----\r\n${signature}\r\n-----END_SIGNATURE ${alice.publicKey}-----`;     
    }

    @action
    encryptCdm(recipients, message, msgHash = false) {
        const { utils } = this.stores;     
        if (typeof window !== 'undefined') {
            
            let randMessage= message;
            let sha = msgHash;
            const rawMessage = message.trim();
            if (msgHash === false) {
                const rand = sha256(utils.generateRandom(64));
                randMessage = rawMessage + '@' + rand;
                sha = sha256(randMessage);
            }

            let msg = '';
            const promises = [];
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

            return Promise.all(promises).then(_ => {
                return msg;
            });
        }
    }

    @action
    generateCdm(recipients, message) {
        return new Promise((resolve, reject) => {
            this.encryptCdm(recipients, message).then(res => {
                resolve(this.wrapCdm(res));
            })
        })
    }

    @action
    generateForwardCdm(recipients, list) {
        return new Promise((resolve, reject) => {
            const promises = [];
            for (let i = 0; i < list.length; i += 1) {
                const p = this.encryptCdm(recipients, list[i].message, list[i].hash);
                promises.push(p);
            }

            Promise.all(promises).then(res => { 
                return resolve(this.wrapCdm(res));
            });
        })
        
    }


    @action
    decryptMessage(cypherText, publicKey, clearHash) {
        const { alice } = this.stores;
        return new Promise((resolve, reject) => {
            if (typeof window !== 'undefined') {
                window.Waves
                    .decryptMessage(cypherText, publicKey, 'chainify')
                    .then(res => {
                        if (clearHash === true) {
                            resolve(res.replace(/@[\w]{64}$/gmi, ""));
                        } else {
                            resolve(res)
                        }
                    })
                    .catch(e => {
                        console.log(e);
                        console.log('cypherText', cypherText);
                        
                        resolve('⚠️ Decoding error');
                    });
            }
        })
    }
}

export default CryptoStore;

