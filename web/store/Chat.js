import { action, observable, toJS } from 'mobx';
import axios from 'axios';
import { sha256 } from 'js-sha256';

import { signBytes, keyPair, randomSeed, base58Encode, sharedKey, messageEncrypt, messageDecrypt } from '@waves/ts-lib-crypto';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { SPONSOR_HOST, CLIENT_SEED, API_HOST, KEEPER_PREFIX, CDM_VERSION, NETWORK } = publicRuntimeConfig;


class ChatStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.sendSponsoredCdm = this.sendSponsoredCdm.bind(this);
        this.chatDestroy = this.chatDestroy.bind(this);
        this.selfClearChat = this.selfClearChat.bind(this);
    }
    
    @observable list = null;
    @observable thread = null
    @observable seed = null;
    @observable recipient = null;
    @observable lastTxId = null;
    @observable heartbeatStatus = 'init';
    @observable sendCdmStatus = 'init';
    @observable subject = '';
    @observable message = '';
    @observable cdmData = null;
    @observable goodByeCdm = null;

    @action
    heartbeat() {
        const { utils, threads, alice } = this.stores;
        if (this.seed === null) { return }
        const keys = keyPair(this.seed);
        const formConfig = {};
        const formData = new FormData();
        formData.append('publicKey', keys.publicKey);
        if (this.lastTxId) {
            formData.append('lastTxId', this.lastTxId);
        }

        this.heartbeatStatus = 'pending';
        utils.sleep(this.heartbeatStatus === 'init' ? 0 : 1000).then(() => {
            axios.post(`${API_HOST}/api/v1/heartbeat`, formData, formConfig)
                .then(res => {
                    const listThreads = res.data.threads;
                    this.list = listThreads;

                    if (listThreads.length > 0) {
                        // const lastThreadCdms = this.thread
                        //     ? listThreads.filter(el => el.threadHash === thread.threadHash)[0].cdms
                        //     : listThreads[0].cdms;
                        const lastThreadCdms = listThreads[0].cdms;
                        const lastTxId = lastThreadCdms[0].txId;

                        if (this.lastTxId !== lastTxId) {
                            this.decrypItem(listThreads[0])
                                .then(res => {
                                    const lastCdm = res.cdms[res.cdms.length - 1];

                                    if (lastCdm.subjectHash === 'bdb08804137f8c6b2374b0fd68dfeb6ff38471e221119e59f38c3d5f3f8cc521') {
                                        this.outerClearChat();
                                    } else {
                                        this.sendCdmStatus = 'success';
                                        this.thread = res;
                                    }
                                })
                            this.lastTxId = lastTxId;
                        }
                    }             
                })
                .then(_ => {
                    this.heartbeatStatus = 'success';
                })
                .catch(e => {
                    this.heartbeatStatus = 'error';
                });
        });
    }

    @action
    newCdm() {
        const keys = keyPair(this.seed);
        const text = this.subject || '' + this.message || '';
        const bytes = Uint8Array.from(sha256(text));
        const signature = signBytes(keys, bytes);

        const cdm = {
            subject: 'One-time request',
            message: this.message,
            rawSubject: null,
            rawMessage: null,
            regarding: null,
            forwarded: null,
            from: {
                senderPublicKey: keys.publicKey,
                senderSignature: signature,
            },
            recipients: [{
                recipient: this.recipient,
                type: 'to',
            }],
        };

        this.cdmData = [cdm];
    }

    @action
    replyToThread() {
        const keys = keyPair(this.seed);
        const text = this.subject || '' + this.message || '';
        const bytes = Uint8Array.from(sha256(text));
        const signature = signBytes(keys, bytes);

        const initCdm = this.thread.cdms[0];

        const re = {
            subject: `Re: ${initCdm.subject}`,
            message: this.message,
            rawSubject: null,
            rawMessage: null,
            regarding: {
                reSubjectHash: initCdm.subjectHash,
                reMessageHash: initCdm.messageHash,
            },
            forwarded: null,
            from: {
                senderPublicKey: keys.publicKey,
                senderSignature: signature,
            },
            recipients: [{
                recipient: this.recipient,
                type: 'cc',
            }],
        };

        this.cdmData = [re];
    }


    @action
    sendSponsoredCdm() {
        const { notifiers } = this.stores;
        if (this.thread) {
            this.replyToThread();
        } else {
            this.newCdm();
        }

        if (this.cdmData === null) { return }

        // this.compose(this.cdmData).then(cdm => {
        //     console.log(cdm);
        // })
        // return;

        this.subject = '';
        this.message = '';
        this.sendCdmStatus = 'pending';
        this.compose(this.cdmData).then(cdm => {
            const formConfig = {};
            const formData = new FormData();
            formData.append('data', cdm);
            return axios.post(`${API_HOST}/api/v1/ipfs`, formData, formConfig)
                .then(ipfsData => {
                    return ipfsData;
                });
        })
        .then(ipfsData => {
            const keys = keyPair(CLIENT_SEED);
            const bytes = Uint8Array.from(keys.publicKey);
            const signature = signBytes(keys, bytes);

            const formData = new FormData();
            formData.append('signature', signature);
            formData.append('ipfsHash', ipfsData.data['Hash']);
            const formConfig = {};
            axios.post(`${SPONSOR_HOST}/sponsor`, formData, formConfig)
                .then(res => {
                    notifiers.success('Message has been sent');
                    this.sendCdmStatus = 'success';
                })
                .catch(e => {
                    console.log('err', e);
                    this.sendCdmStatus = 'error';
                });
        })        
    }

    @action
    chatInit() {
        const newSeed = randomSeed();
        const seedPhrase = sessionStorage.getItem('seedPhrase');
        
        if (seedPhrase) {
            this.seed = seedPhrase;
        } else {
            sessionStorage.setItem('seedPhrase', newSeed);
            this.seed = newSeed;
        }
    }

    @action
    chatDestroy() {
        sessionStorage.removeItem('seedPhrase');
        this.seed = null;
        this.list = null;
        this.thread = null;
        this.message = null;
        this.subject = null;
        this.lastTxId = null;
    }

    selfClearChat() {
        // const { notifiers } = this.stores;
        // notifiers.selfClearedChat();
        this.chatDestroy();
        location.reload();
    }

    outerClearChat() {
        const { notifiers } = this.stores;
        this.chatDestroy();
        // notifiers.outerClearedChat();
    }


    @action
    wrapCdm(messages) {          
        let cdm = '<?xml version="1.0"?>';
        cdm += '\r\n<cdm>';
        cdm += `\r\n<version>${CDM_VERSION}</version>`;
        cdm += '\r\n<blockchain>Waves</blockchain>';
        cdm += `\r\n<network>${NETWORK.charAt(0).toUpperCase() + NETWORK.slice(1)}</network>`;
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
            const keys = keyPair(this.seed);
            const messageHash = sha256(text);
            
            const cipherBytes = messageEncrypt(sharedKey(keys.privateKey, recipient, KEEPER_PREFIX), text);
            const cipherText = base58Encode(cipherBytes);

            msg += `\r\n<ciphertext>${cipherText}</ciphertext>`;
            msg += `\r\n<sha256>${messageHash}</sha256>`;

            resolve(msg);
        })
    }

    @action
    block(subject, message, recipient, type) {
        return new Promise((resolve, reject) => {
            let msg = '';
            const promises = [];

            console.log('subject', subject);
            console.log('message', message);
            
            
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
    cdmMessage(data) {
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
            let msg = '';
            const promises = [];
            for (let i = 0; i < data.length; i += 1) {
                const message = this.cdmMessage(data[i]).then(res => {
                    msg += res;
                });
                promises.push(message);
            }

            Promise.all(promises).then(_ => {
                resolve(this.wrapCdm(msg));
            });
        })
    }


    @action
    decryptMessage(cipherText, publicKey) {
        return new Promise((resolve, reject) => {
            const keys = keyPair(this.seed)
            let decryptedMessage;
            try {
                decryptedMessage = messageDecrypt(sharedKey(keys.privateKey, publicKey, KEEPER_PREFIX), cipherText);
            } catch (err) {
                decryptedMessage = '⚠️ Decoding error';
            }
            resolve(decryptedMessage.replace(/@[\w]{64}$/gmi, ""));
        })
    }

    @action
    decrypItem(item) {
        return new Promise((resolve, reject) => {
            const promises = [];
            const cdms = [];

            for (let j = 0; j < item.cdms.length; j += 1) {
                const p = this.decryptCdm(item.cdms[j]).then(cdm => {
                    cdms.push(cdm);
                })
                .catch(e => {
                    console.log('e', e);
                });
                promises.push(p);
            }

            Promise.all(promises).then(_ => {
                item.cdms = cdms.reverse();
                resolve(item);
            });
        });
    }


    @action
    decryptCdm(cdm) {
        return new Promise((resolve, reject) =>  {
            const promises = [];
            
            if (cdm.subject) {
                const subject = this.decryptMessage(
                    cdm.subject,
                    cdm.direction === 'outgoing' ? cdm.recipient : cdm.logicalSender
                )
                .then(res => {
                    cdm.rawSubject = res;
                    cdm.subject = res.replace(/@[\w]{64}$/gmi, "", '');
                })
                .catch(e => {
                    console.log('subject err', e);
                });;
                promises.push(subject);
            }

            if (cdm.message) {
                const message = this.decryptMessage(
                    cdm.message,
                    cdm.direction === 'outgoing' ? cdm.recipient : cdm.logicalSender
                )
                .then(res => {
                    cdm.rawMessage = res;
                    cdm.message = res.replace(/@[\w]{64}$/gmi, "", '');
                })
                .catch(e  => {
                    console.log('message err', e);
                });
                promises.push(message);
            }
    
            Promise.all(promises)
                .then(_ => resolve(cdm))
                .catch(e => reject(e));
        })
        
    }
}

export default ChatStore;

