import { action } from 'mobx';
import { sha256 } from 'js-sha256';

class CryptoStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.wrapCdm = this.wrapCdm.bind(this);
        this.encryptCdm = this.encryptCdm.bind(this);
        this.decryptMessage = this.decryptMessage.bind(this);
    }

    @action
    wrapCdm(messages) {          
        let cdm = '<?xml version="1.0"?>';
        cdm += '\r\n<cdm>';
        cdm += '\r\n<version>5</version>';
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
    encryptCdm(data) {
        if (typeof window !== 'undefined') {
            let msg = '';
            const promises = [];
            for (let i = 0; i < data.length; i += 1) {
                let randMessage = data[i].text;
                let messageHash = data[i].hash;
                
                if (!messageHash) {
                    randMessage = this.randomize(data[i].text);
                    messageHash = sha256(randMessage);
                }

                const p = window.Waves
                    .encryptMessage(randMessage, data[i].recipient, 'chainify')
                    .then(cypherText => {
                        msg += `\r\n<message>`
                        msg += `\r\n<recipient>`;
                        msg += `\r\n<publickey>${data[i].recipient}</publickey>`;
                        msg += `\r\n<type>${data[i].type}</type>`;
                        msg += `\r\n</recipient>`;
                        msg += `\r\n<subject>`;
                        msg += `\r\n<ciphertext></ciphertext>`;
                        msg += `\r\n<sha256></sha256>`;
                        msg += `\r\n</subject>`;
                        msg += `\r\n<body>`;
                        msg += `\r\n<ciphertext>${cypherText}</ciphertext>`;
                        msg += `\r\n<sha256>${messageHash}</sha256>`;
                        msg += `\r\n</body>`;
                        // msg += `\r\n<inreplyto>${cypherText}</inreplyto>`;
                        msg += `\r\n</message>`;
                    });
                promises.push(p);
            }

            return Promise.all(promises).then(_ => {
                return msg;
            });
        }
    }

    @action
    encrypt(text, recipient) {
        return new Promise((resolve, reject) => {
            let msg = '';
            const randMessage = this.randomize(text);
            const messageHash = sha256(randMessage);
            window.Waves
                .encryptMessage(randMessage,recipient, 'chainify')
                .then(cypherText => {
                    msg += `\r\n<ciphertext>${cypherText}</ciphertext>`;
                    msg += `\r\n<sha256>${messageHash}</sha256>`;

                    resolve(msg);
                })
                .catch(e => {
                    reject(e);
                })
        })
    }

    @action
    compose(data) {
        return new Promise((resolve, reject) => {
            if (typeof window !== 'undefined') {
                let msg = '';
                const promises = [];
                for (let i = 0; i < data.recipients.length; i += 1) {
                    if (data.subject) {
                        const subject = this.encrypt(data.subject, data.recipients[i].recipient)
                            .then(res => {                                
                                msg += `\r\n<subject>`;
                                msg += res;
                                msg += `\r\n</subject>`;
                            });
                        promises.push(subject);
                    }
                    
                    if (data.message) {
                        const message = this.encrypt(data.message, data.recipients[i].recipient)
                            .then(res => {
                                msg += `\r\n<body>`;
                                msg += res;
                                msg += `\r\n</body>`;
                            });
                        promises.push(message);
                    }
                }
    
                Promise.all(promises).then(_ => {
                    resolve(msg);
                });
            } else {
                reject('WINDOW is undefined');
            }
        })
    }

    @action
    generateCdm(data) {
        return new Promise((resolve, reject) => {
            this.encryptCdm(data).then(res => {
                resolve(this.wrapCdm(res));
            })
        })
    }

    // @action
    // generateForwardCdm(recipients, list) {
    //     return new Promise((resolve, reject) => {
    //         const promises = [];
    //         for (let i = 0; i < list.length; i += 1) {
    //             console.log('i', i, list[i].hash);
                
    //             const p = this.encryptCdm(recipients, list[i].message);
    //             promises.push(p);
    //         }

    //         Promise.all(promises).then(res => { 
    //             return resolve(this.wrapCdm(res));
    //         });
    //     })
        
    // }

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
                        resolve('⚠️ Decoding error');
                    });
            }
        })
    }
}

export default CryptoStore;

