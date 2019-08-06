import { action } from 'mobx';
import { sha256 } from 'js-sha256';

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
    encrypt(recipient, text, hash) {
        return new Promise((resolve, reject) => {
            let msg = '';
            const randMessage = this.randomize(text);
            const messageHash = sha256(randMessage);
            window.Waves
                .encryptMessage(randMessage,recipient, 'chainify')
                .then(cypherText => {
                    msg += `\r\n<ciphertext>${cypherText}</ciphertext>`;
                    msg += `\r\n<sha256>${hash ? hash : messageHash}</sha256>`;

                    resolve(msg);
                })
                .catch(e => {
                    reject(e);
                })
        })
    }

    @action
    block(subject, message, messageHash, recipient, type) {
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

            const body = this.encrypt(recipient, message, messageHash)
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
    message(data, groupHash) {
        return new Promise((resolve, reject) => {
            let msg = '';            
            const promises = [];
            for (let i = 0; i < data.recipients.length; i += 1) {
                const block = this.block(
                        data.subject,
                        data.message,
                        data.messageHash,
                        data.recipients[i].recipient, 
                        data.recipients[i].type
                    )
                    .then(res => {
                        msg += '\r\n<message>';
                        msg += res;
                        if (groupHash) {
                            msg += '\r\n<extra>';
                            msg += `\r\n<groupHash>${groupHash}</groupHash>`;
                            msg += '\r\n</extra>';
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
                const { groups, cdms } = this.stores;

                let msg = '';
                let groupHash = null;
                if (groups.current) {
                    if (cdms.fwdCdmsList.length === 0) {
                        groupHash = groups.current.groupHash;
                    } else {
                        const initSubjectHash = data[0].subject ? sha256(this.randomize(data[0].subject)) : '';
                        const initMessageHash = data[0].messageHash;
                        groupHash = sha256([initSubjectHash, initMessageHash].join(''));
                    }
                }

                const promises = [];
                for (let i = 0; i < data.length; i += 1) {
                    const message = this.message(data[i], groupHash).then(res => {
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

    // @action
    // generateForwardCdm(recipients, list) {
    //     return new Promise((resolve, reject) => {
    //         const promises = [];
    //         for (let i = 0; i < list.length; i += 1) {
    //             console.log('i', i, list[i].messageHash);
                
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

