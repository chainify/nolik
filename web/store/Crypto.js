import { action } from 'mobx';
import { sha256 } from 'js-sha256';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { CDM_VERSION, KEEPER_PREFIX } = publicRuntimeConfig;

class CryptoStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.wrapCdm = this.wrapCdm.bind(this);
        this.decryptMessage = this.decryptMessage.bind(this);
    }

    @action
    wrapCdm(messages) {          
        let cdm = '<?xml version="1.0"?>';
        cdm += '\r\n<cdm>';
        cdm += `\r\n<version>${CDM_VERSION}</version>`;
        cdm += '\r\n<blockchain>Waves</blockchain>';
        cdm += '\r\n<network>Mainnet</network>';
        cdm += '\r\n<messages>';
        cdm += messages;
        cdm += '\r\n</messages>';
        cdm += '\r\n</cdm>';
        return cdm;
    }

    @action
    randomize(message) {
        const { utils } = this.stores;
        if (!message) return null;
        return message + '@' + sha256(utils.generateRandom(64));
    }

    @action
    encrypt(recipient, text) {
        return new Promise((resolve, reject) => {
            let msg = '';
            const messageHash = sha256(text);
            window.Waves
                .encryptMessage(text, recipient, KEEPER_PREFIX)
                .then(cipherText => {
                    msg += `\r\n<ciphertext>${cipherText}</ciphertext>`;
                    msg += `\r\n<sha256>${messageHash}</sha256>`;

                    resolve(msg);
                })
                .catch(e => {
                    reject(e);
                })
        })
    }

    @action
    block(subject, message, recipient, type) {
        return new Promise((resolve, reject) => {
            let msg = '';
            const promises = [];
            if (subject) {
                const sbj = this.encrypt(recipient, subject)
                    .then(res => {                                
                        msg += `\r\n<subject>`;
                        msg += res;
                        msg += `\r\n</subject>`;
                    });
                promises.push(sbj);
            }

            const body = this.encrypt(recipient, message)
                .then(res => {
                    msg += `\r\n<${type}>`;
                    msg += `\r\n<publickey>${recipient}</publickey>`;
                    msg += `\r\n</${type}>`;
                    msg += `\r\n<body>`;
                    msg += res;
                    msg += `\r\n</body>`;
                });

            promises.push(body);

            Promise.all(promises).then(_ => {
                resolve(msg);
            });
        })
    }

    @action
    message(data) {
        return new Promise((resolve, reject) => {
            let msg = '';            
            const promises = [];
            
            const subject = data.rawSubject ? data.rawSubject : this.randomize(data.subject);
            const message = data.rawMessage ? data.rawMessage : this.randomize(data.message);
            const reSubjectHash = data.regarding ? data.regarding.reSubjectHash : null;
            const reMessageHash = data.regarding ? data.regarding.reMessageHash : null;

            const fwdSubjectHash = data.forwarded ? data.forwarded.fwdSubjectHash : null;
            const fwdMessageHash = data.forwarded ? data.forwarded.fwdMessageHash : null;

            const senderPublicKey = data.from ? data.from.senderPublicKey : null;
            const senderSignature = data.from ? data.from.senderSignature : null;

            for (let i = 0; i < data.recipients.length; i += 1) {
                const block = this.block(
                        subject,
                        message,
                        data.recipients[i].recipient, 
                        data.recipients[i].type
                    )
                    .then(res => {
                        msg += '\r\n<message>';
                        msg += res;
                        if (data.regarding) {
                            msg += `\r\n<regarding>`;
                            if (reSubjectHash) { msg += `\r\n<subjecthash>${reSubjectHash}</subjecthash>`}
                            if (reMessageHash) { msg += `\r\n<messagehash>${reMessageHash}</messagehash>`}
                            msg += `\r\n</regarding>>`;
                        }
                        if (data.forwarded) {
                            msg += `\r\n<forwarded>`;
                            if (fwdSubjectHash) { msg += `\r\n<subjecthash>${fwdSubjectHash}</subjecthash>`}
                            if (fwdMessageHash) { msg += `\r\n<messagehash>${fwdMessageHash}</messagehash>`}
                            msg += `\r\n</forwarded>`;
                        }
                        if (data.from) {
                            msg += `\r\n<from>`;
                            msg += `\r\n<sender>`;
                            if (senderPublicKey) { msg += `\r\n<publickey>${senderPublicKey}</publickey>`}
                            if (senderSignature) { msg += `\r\n<signature>${senderSignature}</signature>`}
                            msg += `\r\n</sender>`;
                            msg += `\r\n</from>`;
                        }
                        msg += '\r\n</message>';
                    });
                promises.push(block);
            }

            Promise.all(promises).then(_ => {
                resolve(msg);
            });
        })
    }


    @action
    compose(data) {
        return new Promise((resolve, reject) => {
            if (typeof window !== 'undefined') {
                let msg = '';
                const promises = [];
                for (let i = 0; i < data.length; i += 1) {
                    const message = this.message(data[i]).then(res => {
                        msg += res;
                    });
                    promises.push(message);
                }

                Promise.all(promises).then(_ => {
                    resolve(this.wrapCdm(msg));
                });
            } else {
                reject('WINDOW is undefined');
            }
        })
    }


    @action
    decryptMessage(cipherText, publicKey) {
        return new Promise((resolve, reject) => {
            if (typeof window !== 'undefined') {
                window.Waves
                    .decryptMessage(cipherText, publicKey, KEEPER_PREFIX)
                    .then(res => {
                        resolve(res);
                    })
                    .catch(e => {
                        resolve('⚠️ Decoding error');
                    });
            }
        })
    }
}

export default CryptoStore;

