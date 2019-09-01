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
        this.toggleShowDrawer = this.toggleShowDrawer.bind(this);
        this.copySeedPhrase = this.copySeedPhrase.bind(this);
        this.copyChatUrl = this.copyChatUrl.bind(this);
        this.toggleSubjectModal = this.toggleSubjectModal.bind(this);
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
    @observable showDrawer = false;
    @observable showSubjectModal = false;


    @action
    toggleShowDrawer() {
        this.showDrawer = !this.showDrawer;
    }

    @action
    toggleSubjectModal() {
        this.showSubjectModal = !this.showSubjectModal;
    }

    @action
    setThread(item) {
        this.thread = item;
    }

    @action
    heartbeat() {
        const { utils, notifiers } = this.stores;
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
                    if (listThreads.length > 0) {
                        const lastThreadCdms = listThreads[0].cdms;
                        const lastTxId = lastThreadCdms[0].txId;

                        if (this.lastTxId !== lastTxId) {
                            const promises = [];
                            for (let i = 0; i < listThreads.length; i += 1) {
                                const p = this.decrypItem(listThreads[i])
                                    .then(res => {
                                        return res;
                                        // const lastCdm = res.cdms[res.cdms.length - 1];
                                        // if (lastCdm.subjectHash === 'bdb08804137f8c6b2374b0fd68dfeb6ff38471e221119e59f38c3d5f3f8cc521') {
                                        //     this.outerClearChat();
                                        // } else {
                                        //     this.sendCdmStatus = 'success';
                                        //     this.thread = res;
                                        // }
                                    });
                                promises.push(p);
                            }

                            Promise.all(promises).then(list => {                                
                                const currentList = this.list || [];
                                const currentHahses = currentList.map(el => el.threadHash);

                                const indexesToDelete = [];
                                for (let i = 0; i < list.length; i += 1) {
                                    const index = currentHahses.indexOf(list[i].threadHash);
                                    
                                    if (index > -1) {
                                        indexesToDelete.push(index);
                                    }
                                }

                                const sorted = indexesToDelete.sort(function(a, b){return b-a});
                                for (let i = 0; i < sorted.length; i += 1) {
                                    currentList.splice(sorted[i], 1);
                                }

                                list.reverse();
                                if (this.thread) {
                                    if(this.thread.threadHash !== list[0].threadHash) {
                                        for (let i = 0; i < list.length; i += 1) {
                                            notifiers.newThread(list[i]);
                                        }
                                    } else {
                                        this.thread = list[0];
                                    }
                                } else {
                                    this.thread = list[0];
                                }

                                this.list = list.concat(currentList);
                                this.lastTxId = list[0].cdms[list[0].cdms.length - 1].txId;
                                this.sendCdmStatus = 'success';

                                
                            });
                        }
                    } else {
                        if (this.list === null) {
                            this.list = [];
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
            subject: this.subject || 'One-time request',
            message: this.message,
            rawSubject: null,
            rawMessage: null,
            regarding: null,
            forwarded: null,
            from: {
                senderPublicKey: keys.publicKey,
                senderSignature: signature,
            },
            recipients: this.thread ? this.thread.members.map(el => ({
                recipient: el,
                type: 'to',
            })) : [{
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
            recipients: this.thread ? this.thread.members.map(el => ({
                recipient: el,
                type: 'cc',
            })) : [{
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
                    this.showSubjectModal = false;
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
        this.chatDestroy();
        location.reload();
    }

    outerClearChat() {
        const { notifiers } = this.stores;
        this.chatDestroy();
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

    @action
    copySeedPhrase() {
        const { notifiers } = this.stores;
        this.clipboardTextarea(this.seed);
        notifiers.info('Seed phrase has been copied');
    }

    @action
    copyChatUrl() {
        const { notifiers } = this.stores;
        const publicKey = keyPair(this.seed).publicKey;
        const url = `${API_HOST}/pk/${publicKey}`;
        this.clipboardTextarea(url);
        notifiers.info('Chat URL has been copied');
    }

    @action
    clipboardTextarea(text) {
        const id = "clipboard-textarea-hidden-id";
        let existsTextarea = document.getElementById(id);

        if (!existsTextarea){
            const textarea = document.createElement("textarea");
            textarea.id = id;
            // Place in top-left corner of screen regardless of scroll position.
            textarea.style.position = 'fixed';
            textarea.style.top = 0;
            textarea.style.left = 0;

            // Ensure it has a small width and height. Setting to 1px / 1em
            // doesn't work as this gives a negative w/h on some browsers.
            textarea.style.width = '1px';
            textarea.style.height = '1px';

            // We don't need padding, reducing the size if it does flash render.
            textarea.style.padding = 0;

            // Clean up any borders.
            textarea.style.border = 'none';
            textarea.style.outline = 'none';
            textarea.style.boxShadow = 'none';

            // Avoid flash of white box if rendered for any reason.
            textarea.style.background = 'transparent';
            document.querySelector("body").appendChild(textarea);
            existsTextarea = document.getElementById(id);
        }

        existsTextarea.value = text;
        existsTextarea.select();

        try {
            document.execCommand('copy');
            existsTextarea.parentNode.removeChild(existsTextarea);
        } catch (err) {
            // console.log('Unable to copy.');
        }
    }
}

export default ChatStore;

