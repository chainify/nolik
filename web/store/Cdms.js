import { action, observable } from 'mobx';
import axios from 'axios';
import * as moment from 'moment';
import { message, notification } from 'antd';
import { sha256 } from 'js-sha256';
import { toJS } from 'mobx';
import stringFromUTF8Array from '../utils/batostr';
import { crypto } from '@waves/ts-lib-crypto';
const { address } = crypto({output: 'Base58'});


import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { NETWORK, ASSET_ID, API_HOST } = publicRuntimeConfig;

class CdmStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.sendCdm = this.sendCdm.bind(this);
        this.forwardAllMessagesToNewMembers = this.forwardAllMessagesToNewMembers.bind(this);
    }

    
    @observable withCrypto = [];
    @observable withRecipients = [];
    @observable fwdCdmsList = [];
    @observable sendCdmStatus = 'init';
    @observable fwdRecipients = null;

    @observable cdmData = null;
    
    // @observable readCdmDB = null;
    // @observable pendnigDB = null;
    
    @action
    initLevelDB() {
        const { alice } = this.stores;
        const levelup = require('levelup');
        const leveljs = require('level-js');

        if (alice.publicKey) {
            // this.readCdmDB = levelup(leveljs(`/root/.leveldb/read_cdms_${alice.publicKey}`));
        }
    }

    @action
    toggleWithCrypto(txId) {
        const withCrypto = this.withCrypto;
        const index = withCrypto.indexOf(txId);
        if (index < 0) {
            withCrypto.push(txId);
        } else {
            withCrypto.splice(index, 1);
        }
        this.withCrypto = withCrypto;
    }

    @action
    toggleWithRecipients(txId) {
        const withRecipients = this.withRecipients;
        const index = withRecipients.indexOf(txId);
        if (index < 0) {
            withRecipients.push(txId);
        } else {
            withRecipients.splice(index, 1);
        }
        this.withRecipients = withRecipients;
    }

    @action
    generateTxData(attachment) {
        const { alice } = this.stores;
        const recipient = NETWORK === 'testnet' ? address(alice.publicKey, 'T') : address(alice.publicKey);
        const txData = {
            type: 4,
            data: {
                amount: {
                assetId: ASSET_ID,
                tokens: "0.00000001"
                },
                fee: {
                    assetId: ASSET_ID,
                    tokens: "0.001"
                },
                recipient: recipient,
                attachment: attachment
            }
        };
        return txData;
    }

    @action
    sendCdm() {
        const { notifiers, crypto, compose } = this.stores;
        this.sendCdmStatus = 'pending';

        switch(compose.cdmType) {
            case 'replyToThread':
                this.replyToThread();
                break;
            case 'replyToMessage':
                this.replyToMessage();
                break;
            case 'replyMessageToAll':
                this.replyMessageToAll();
                break;
            case 'forwardMessage':
                this.forwardMessage();
                break;
            case 'forwardAllMessagesToNewMembers':
                this.forwardAllMessagesToNewMembers();
                break;
            case 'removeChatRequest':
                this.removeChatRequest();
                break;
            default:
                this.newCdm();
                break;
        }

        if (this.cdmData === null) { return }

        // crypto.compose(this.cdmData).then(cdm => {
        //     console.log(cdm);
        // })
        // return;
        crypto.compose(this.cdmData).then(cdm => {
            const formConfig = {};
            const formData = new FormData();
            formData.append('data', cdm);
            return axios.post(`${API_HOST}/api/v1/ipfs`, formData, formConfig)
                .then(ipfsData => {
                    return ipfsData;
                });
        })
        .then(ipfsData => {
            if (typeof window !== 'undefined') {
                const txData = this.generateTxData(ipfsData.data['Hash']);
                return window.WavesKeeper.signAndPublishTransaction(txData)
                    .then(data => {
                        return data;
                    }).catch(e => {
                        console.log(e);
                        notifiers.keeper(e);
                    });
            }
        })
        .then(data => {
            if (data) {
                notifiers.success('Message has been sent');
                compose.resetCompose();
            }
            
            this.cdmData = null;
            this.newRecipients = null;
            this.sendCdmStatus = 'success';
        })
        .catch(e => {
            console.log(e);
            this.sendCdmStatus = 'error';
            notifiers.error(e);
        });
    }

    @action
    newCdm() {
        const { compose } = this.stores;
        const cdm = {
            subject: compose.subject.trim(),
            message: compose.message.trim(),
            rawSubject: null,
            rawMessage: null,
            regarding: null,
            forwarded: null,
            recipients: compose.toRecipients.map(el => ({
                recipient: el,
                type: 'to',
            })).concat(compose.ccRecipients.map(el => ({
                recipient: el,
                type: 'cc',
            }))),
        };

        this.cdmData = [cdm];
    }

    @action
    replyToThread() {
        const { compose, threads } = this.stores;
        const re = {
            subject: compose.subject.trim(),
            message: compose.message.trim(),
            rawSubject: null,
            rawMessage: null,
            regarding: {
                reSubjectHash: compose.reSubjectHash,
                reMessageHash: compose.reMessageHash
            },
            forwarded: null,
            recipients: threads.current.members.map(el => ({
                recipient: el,
                type: 'cc',
            })),
        };

        this.cdmData = [re];
    }

    @action
    replyToMessage() {
        const { compose, crypto } = this.stores;
        const rawSubject = crypto.randomize(compose.fwdItem.subject);

        const fwd = {
            subject: compose.fwdItem.subject,
            message: compose.fwdItem.message,
            rawSubject: rawSubject,
            rawMessage: compose.fwdItem.rawMessage,
            regarding: null,
            forwarded: {
                fwdSubjectHash: compose.fwdItem.subjectHash,
                fwdMessageHash: compose.fwdItem.messageHash
            },
            recipients: compose.toRecipients.map(el => ({
                recipient: el,
                type: 'to',
            })),
        };

        const re = {
            subject: compose.subject.trim(),
            message: compose.message.trim(),
            rawSubject: null,
            rawMessage: null,
            regarding: {
                reSubjectHash: sha256(rawSubject),
                reMessageHash: compose.fwdItem.messageHash
            },
            forwarded: null,
            recipients: compose.toRecipients.map(el => ({
                recipient: el,
                type: 'to',
            })),
        };

        this.cdmData = [fwd, re];
    }

    @action
    replyMessageToAll() {
        const { threads, compose, crypto } = this.stores;

        const rawSubject = crypto.randomize(compose.fwdItem.subject);
        const fwd = {
            subject: compose.fwdItem.subject,
            message: compose.fwdItem.message,
            rawSubject: rawSubject,
            rawMessage: compose.fwdItem.rawMessage,
            regarding: null,
            forwarded: {
                fwdSubjectHash: compose.fwdItem.subjectHash,
                fwdMessageHash: compose.fwdItem.messageHash
            },
            recipients: threads.current.members.map(el => ({
                recipient: el,
                type: 'to',
            })),
        };

        const re = {
            subject: compose.subject.trim(),
            message: compose.message.trim(),
            rawSubject: null,
            rawMessage: null,
            regarding: {
                reSubjectHash: sha256(rawSubject),
                reMessageHash: compose.fwdItem.messageHash
            },
            forwarded: null,
            recipients: threads.current.members.map(el => ({
                recipient: el,
                type: 'to',
            })),
        };

        this.cdmData = [fwd, re];
    }

    @action
    forwardMessage() {
        const { compose, crypto } = this.stores;

        const subject = compose.subject.trim();
        const message = compose.message.trim();

        const rawSubject = crypto.randomize(subject);
        const rawMessage = crypto.randomize(message);

        const cdm = {
            subject: subject,
            message: message,
            rawSubject: rawSubject,
            rawMessage: rawMessage,
            regarding: null,
            forwarded: null,
            recipients: compose.toRecipients.map(el => ({
                recipient: el,
                type: 'to',
            })).concat(compose.ccRecipients.map(el => ({
                recipient: el,
                type: 'cc',
            }))),
        };

        const fwd = {
            subject: `Fwd: ${compose.fwdItem.subject}`,
            message: compose.fwdItem.message,
            rawSubject: null,
            rawMessage: compose.fwdItem.rawMessage,
            regarding: {
                reSubjectHash: sha256(rawSubject),
                reMessageHash: sha256(rawMessage)
            },
            forwarded: {
                fwdSubjectHash: compose.fwdItem.subjectHash,
                fwdMessageHash: compose.fwdItem.messageHash
            },
            recipients: compose.toRecipients.map(el => ({
                recipient: el,
                type: 'to',
            })).concat(compose.ccRecipients.map(el => ({
                recipient: el,
                type: 'cc',
            }))),
        };

        this.cdmData = [cdm, fwd];
    }

    @action
    forwardAllMessagesToNewMembers() {
        const { threads, compose, crypto } = this.stores;

        const cdms = threads.current.cdms;
        const cdmData = [];
        const initCdm = cdms[cdms.length - 1];

        const initRawSubject = crypto.randomize(initCdm.subject);

        for (let i = 0; i < cdms.length; i += 1) {
            const fwd = {
                subject: cdms[i].subject,
                message: cdms[i].message,
                rawSubject: cdms[i].id === initCdm.id ? initRawSubject : null,
                rawMessage: cdms[i].rawMessage,
                regarding: cdms[i].id !== initCdm.id ? {
                    reSubjectHash: sha256(initRawSubject),
                    reMessageHash: initCdm.messageHash
                } : null,
                forwarded: {
                    fwdSubjectHash: cdms[i].subjectHash,
                    fwdMessageHash: cdms[i].messageHash
                },
                recipients: threads.current.members.map(el => ({
                    recipient: el,
                    type: 'to',
                })).concat(compose.newRecipients.map(el => ({
                    recipient: el,
                    type: 'to',
                }))),
            };
            
            cdmData.push(fwd);
        }

        this.cdmData = cdmData;
    }

    @action
    removeChatRequest() {
        const { compose, threads } = this.stores;
        const cdm = {
            subject: compose.subject.trim(),
            message: compose.message.trim(),
            rawSubject: compose.subject, // bdb08804137f8c6b2374b0fd68dfeb6ff38471e221119e59f38c3d5f3f8cc521
            rawMessage: null,
            regarding: {
                reSubjectHash: compose.reSubjectHash,
                reMessageHash: compose.reMessageHash
            },
            forwarded: null,
            recipients: threads.current.members.map(el => ({
                recipient: el,
                type: 'cc',
            })),
        };

        this.cdmData = [cdm];
    }
}

export default CdmStore;

