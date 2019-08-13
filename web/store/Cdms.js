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
    cdmData() {
        const { compose } = this.stores;
        this.sendCdmStatus = 'pending';
        
        // const grRecipients = threads.current ? threads.current.members : [];
        const toRecipients = compose.toRecipients;
        const ccRecipients = compose.ccRecipients;

        const recipients = toRecipients.concat(ccRecipients);
        const data = [];
        if (this.fwdCdmsList.length === 0) {
            data.push({
                subject: compose.subject.trim(),
                message: compose.message.trim(),
                rawMessage: null,
                recipients: recipients.map(el => ({
                    recipient: el,
                    type: toRecipients.indexOf(el) > -1 ? 'to' : 'cc',
                }))
            });
        } else {
            for (let i = 0; i < this.fwdCdmsList.length; i += 1) {
                const initCdm = this.list.filter(el => el.messageHash === this.fwdCdmsList[i])[0];
                data.push({
                    subject: `FWD: ${initCdm.subject.trim()}`,
                    message: initCdm.message.trim(),
                    rawMessage: initCdm.rawMessage,
                    recipients: recipients.map(el => ({
                        recipient: el,
                        type: toRecipients.indexOf(el) > -1 ? 'to' : 'cc',
                    }))
                })
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
        
        const list = threads.current && this.list.filter(el => el.threadHash === threads.current.threadHash);
        const fwdCdmsList = [];
        if (list) {
            for (let i = 0; i < list.length; i += 1) {
                fwdCdmsList.push(list[i].messageHash);
            }
            this.fwdCdmsList = fwdCdmsList;
        }
        
        for (let i = 0; i < threads.current.members.length; i =+ 1) {
            compose.addTag('ccRecipients', threads.current.members[i]);
        }

        this.sendCdm();
    }
}

export default CdmStore;

