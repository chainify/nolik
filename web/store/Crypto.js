import { action } from 'mobx';
import { signBytes, verifySignature } from '@waves/waves-crypto';
import { sha256 } from 'js-sha256';
import base58 from '../utils/base58';


class CryptoStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.generateCdm = this.generateCdm.bind(this);
        this.encryptCdm = this.encryptCdm.bind(this);
        this.decryptMessage = this.decryptMessage.bind(this);
    }

    @action
    generateCdm(recipients) {
        return new Promise((resolve, reject) => {
            const { alice } = this.stores;                     
            
            this.encryptCdm(recipients).then(res => {
                let cdm = '-----BEGIN_CDM VERSION_1-----';
                cdm += '\r\n-----BEGIN_BLOCKCHAIN WAVES-----';
                cdm += res;
                cdm += '\r\n-----END_BLOCKCHAIN WAVES-----';
                cdm += '\r\n-----END_CDM VERSION_1-----';
                resolve(cdm);
            })
            // cdm += `\r\n-----BEGIN_SIGNATURE ${alice.publicKey}-----\r\n${signature}\r\n-----END_SIGNATURE ${alice.publicKey}-----`;
        });       
    }

    @action
    encryptCdm(recipients) {
        const { cdm, utils } = this.stores;         
        if (typeof window !== 'undefined') {
            const rawMessage = cdm.message.trim();
            const rand = sha256(utils.generateRandom(64));
            const randMessage = rawMessage + '@' + rand;
            
            const sha = sha256(randMessage);
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

            return Promise.all(promises).then(_ => { return msg });
        }
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

