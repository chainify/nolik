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
    @observable withRecipients = [];
    @observable fwdCdmsList = [];
    @observable sendCdmStatus = 'init';
    @observable fwdRecipients = null;
    
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
    messageData(item, recipients) {
        const { compose } = this.stores;
        const toRecipients = compose.toRecipients;
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

        const data = [];
        if (this.fwdRecipients) {
            const cdms = threads.current.cdms;
            const fwdCdmsList = cdms.reverse();
            const initCdm = fwdCdmsList[0];

            const initRawSubject = crypto.randomize(`FWD: ${initCdm.subject}`);
            
            for (let i = 0; i < fwdCdmsList.length; i += 1) {
                const fwdCdm = threads.current.cdms[i];
                const messageData = this.messageData(fwdCdm, this.fwdRecipients);
                messageData.subject = `FWD: ${messageData.subject}`;
                messageData.rawMessage = fwdCdm.rawMessage;
                if (fwdCdm.reSubjectHash && fwdCdm.reMessageHash) {
                    messageData.regarding = {
                        reSubjectHash: fwdCdm.reSubjectHash ? sha256(initRawSubject) : null,
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
        } else {
            data.push(this.messageData(compose, compose.toRecipients.concat(compose.ccRecipients)));
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
            this.fwdRecipients = null;
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
        this.fwdRecipients = compose.toRecipients.concat(threads.current.members);
        this.sendCdm();
    }
}

export default CdmStore;

