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
        this.fwdCdms = this.fwdCdms.bind(this);
    }

    
    @observable withCrypto = [];
    @observable fwdCdmsList = [];
    @observable sendCdmStatus = 'init';
    
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
    messageData(recipients, toRecipients, item) {
        const data = {
            subject: item.subject.trim(),
            message: item.message.trim(),
            rawSubject: null,
            rawMessage: null,
            regarding: item.reMessageHash ? {
                reSubjectHash: item.reSubjectHash || '',
                reMessageHash: item.reMessageHash || '',
            } : null,
            recipients: recipients.map(el => ({
                recipient: el,
                type: toRecipients.indexOf(el) > -1 ? 'to' : 'cc',
            }))
        };
        return data
    }

    @action
    cdmData() {
        const { compose, threads, crypto } = this.stores;
        const toRecipients = compose.toRecipients;
        const ccRecipients = compose.ccRecipients;

        const recipients = toRecipients.concat(ccRecipients);
        const data = [];
        if (this.fwdCdmsList.length === 0) {
            data.push(this.messageData(recipients, toRecipients, compose));
        } else {
            const fwdCdmsList = this.fwdCdmsList.reverse();
            const initCdm = fwdCdmsList[0];

            const initRawSubject = crypto.randomize(`FWD: ${initCdm.subject}`);
            const shaInitRawSubject = sha256(initRawSubject);
            
            for (let i = 0; i < fwdCdmsList.length; i += 1) {
                const fwdCdm = threads.current.cdms[i];
                const messageData = this.messageData(recipients, toRecipients, fwdCdm);
                messageData.subject = `FWD: ${messageData.subject}`;

                messageData.rawMessage = fwdCdm.rawMessage;
                if (fwdCdm.reSubjectHash && fwdCdm.reMessageHash) {
                    messageData.regarding = {
                        reSubjectHash: fwdCdm.reSubjectHash ? shaInitRawSubject : null,
                        reMessageHash: fwdCdm.reMessageHash,
                    }
                } else {
                    messageData.rawSubject = initRawSubject;
                }
                
                messageData.forwarded = {
                    fwdSubjectHash: fwdCdm.subjectHash || '',
                    fwdMessageHash: fwdCdm.messageHash || '',
                },
                
                data.push(messageData);
            }
        }
        
        return toJS(data);
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
        const cdmData = this.cdmData();
        // crypto.compose(cdmData).then(cdm => {
        //     console.log(cdm);
        // })
        // return;
        crypto.compose(cdmData).then(cdm => {
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
            }
            compose.resetCompose();
            this.sendCdmStatus = 'success';
        })
        .catch(e => {
            console.log(e);
            this.sendCdmStatus = 'error';
            notifiers.error(e);
        });
    }


    @action
    fwdCdms() {
        const { threads, compose } = this.stores;
        
        // const list = threads.current && threads.current.cdms;
        // const fwdCdmsList = [];
        // if (list) {
        //     for (let i = 0; i < list.length; i += 1) {
        //         fwdCdmsList.push(list[i].messageHash);
        //     }
        //     this.fwdCdmsList = fwdCdmsList;
        // }

        this.fwdCdmsList = threads.current.cdms;
        compose.toRecipients = compose.toRecipients.concat(threads.current.members)

        this.sendCdm();
    }
}

export default CdmStore;

