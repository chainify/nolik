import { action } from 'mobx';
import { sha256 } from 'js-sha256';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { CDM_VERSION } = publicRuntimeConfig;

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
        // cdm += `\r\n-----BEGIN_SIGNATURE ${alice.publicKey}-----\r\n${signature}\r\n-----END_SIGNATURE ${alice.publicKey}-----`;     
    }

    @action
    randomize(message) {
        const { utils } = this.stores;     
        return message + '@' + sha256(utils.generateRandom(64));
    }

    @action
    encrypt(recipient, text) {
        return new Promise((resolve, reject) => {
            let msg = '';
            const messageHash = sha256(text);
            window.Waves
                .encryptMessage(text, recipient, 'chainify')
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
    block(subject, text, recipient, type) {
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

            const body = this.encrypt(recipient, text)
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
            const text = data.rawMessage ? data.rawMessage : this.randomize(data.message);
            const reSubjectHash = data.regarding ? data.regarding.reSubjectHash : '';
            const reMessageHash = data.regarding ? data.regarding.reMessageHash : '';

            for (let i = 0; i < data.recipients.length; i += 1) {
                const block = this.block(
                        data.subject,
                        text,
                        data.recipients[i].recipient, 
                        data.recipients[i].type
                    )
                    .then(res => {
                        msg += '\r\n<message>';
                        msg += res;
                        if (data.regarding) {
                            msg += '\r\n<regarding>';
                            msg += `\r\n<subjectHash>${reSubjectHash}</subjectHash>`;
                            msg += `\r\n<messageHash>${reMessageHash}</messageHash>`;
                            msg += '\r\n</regarding>';
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
                const { threads, cdms } = this.stores;

                let msg = '';
                // let threadHash = null;
                // if (threads.current) {
                //     if (cdms.fwdCdmsList.length === 0) {
                //         threadHash = threads.current.threadHash;
                //     } else {
                //         const initSubjectHash = data[0].subject ? sha256(this.randomize(data[0].subject)) : '';
                //         const initMessageHash = data[0].messageHash;
                //         threadHash = sha256([initSubjectHash, initMessageHash].join(''));
                //     }
                // }

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
                    .decryptMessage(cipherText, publicKey, 'chainify')
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

