import { action, observable } from 'mobx';
import axios from 'axios';
import * as moment from 'moment';
import { message, notification } from 'antd';
import { sha256 } from 'js-sha256';
import { toJS } from 'mobx';
import stringFromUTF8Array from '../utils/batostr';
import { crypto } from '@waves/ts-lib-crypto';
const { address } = crypto({output: 'Base58'});

class CdmStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.decryptList = this.decryptList.bind(this);
        this.sendCdm = this.sendCdm.bind(this);
        this.fwdCdms = this.fwdCdms.bind(this);
    }

    @observable list = null;
    @observable sendCdmStatus = 'init';
    @observable forwardCdmStatus = 'init';

    @observable withCrypto = [];
    @observable fwdCdmsList = [];
    
    // @observable readCdmDB = null;
    @observable listDB = null;
    @observable pendnigDB = null;
    
    @action
    initLevelDB() {
        const { alice } = this.stores;
        const levelup = require('levelup');
        const leveljs = require('level-js');

        // this.readCdmDB = levelup(leveljs(`/root/.leveldb/read_cdms_${alice.publicKey}`));
        if (alice.publicKey) {
            this.listDB = levelup(leveljs(`/root/.leveldb/list_cdms_${alice.publicKey}`));
            this.pendnigDB = levelup(leveljs(`/root/.leveldb/pending_cdms_${alice.publicKey}`));
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
    readList() {
        const list = [];
        this.listDB.createReadStream()
            .on('data', data => {
                const k = parseInt(stringFromUTF8Array(data.key));
                const v = stringFromUTF8Array(data.value);
                list.push({
                    key: k,
                    value: JSON.parse(v)
                });
                this.listDB.del(k);
            })
            .on('end', _ => {
                this.decryptList(list.map(el => el.value));
            });
    }

    @action
    saveList(list) {
        const records = [];
        this.listDB.createReadStream()
            .on('data', data => {
                const k = parseInt(stringFromUTF8Array(data.key));
                const v = stringFromUTF8Array(data.value);
                records.push({
                    key: k,
                    value: JSON.parse(v)
                });
            })
            .on('end', _ => {
                const operations = [];
                const txIds = records.map(el => el.value.txId);
                const lastKey = records[records.length - 1].key;
                for (let i = 0; i < list.length; i += 1) {
                    if (txIds.indexOf(list[i].txId) < 0) {
                        operations.push({
                            type: 'put',
                            key: lastKey + i + 1,
                            value: JSON.stringify(list[i])
                        });
                    }
                }

                console.log('records', records);
                console.log('operations', operations);
                

                this.listDB.batch(operations, err => {
                    if (err) return console.log('Batch insert error', err);
                    this.readList();
                });
            });
    }


    @action
    decryptList(list) {
        const { crypto } = this.stores;
        const decList = [];
        const promises = [];
        for (let i = 0; i < list.length; i += 1) {
            const listEl = list[i];
            if (listEl.subject) {
                const subject = crypto.decryptMessage(
                    listEl.subject,
                    listEl.direction === 'outgoing' ? listEl.recipient : listEl.logicalSender
                )
                .then(res => {
                    listEl.subject = res.replace(/@[\w]{64}$/gmi, "");
                });
                promises.push(subject);
            }

            const message = crypto.decryptMessage(
                listEl.message, 
                listEl.direction === 'outgoing' ? listEl.recipient : listEl.logicalSender
            )
            .then(msg => {
                listEl.rawMessage = msg;
                listEl.message = msg.replace(/@[\w]{64}$/gmi, "");
                decList.push(listEl);
            })
            promises.push(message);
        }
        Promise.all(promises)
            .then(_ => {
                this.list = decList;
            })
            .catch(e => {
                message.error(e.message || e);
            });
    }

    @action
    cdmData() {
        const { compose } = this.stores;
        this.sendCdmStatus = 'pending';
        
        // const grRecipients = groups.current ? groups.current.members : [];
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
        const recipient = process.env.NETWORK === 'testnet' ? address(alice.publicKey, 'T') : address(alice.publicKey);
        const txData = {
            type: 4,
            data: {
                amount: {
                assetId: process.env.ASSET_ID,
                tokens: "0.00000001"
                },
                fee: {
                    assetId: process.env.ASSET_ID,
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
            return axios.post(`${process.env.API_HOST}/api/v1/ipfs`, formData, formConfig)
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
            notifiers.error(e);
        });
    }


    @action
    fwdCdms() {
        const { groups, compose } = this.stores;
        
        const list = groups.current && this.list.filter(el => el.groupHash === groups.current.groupHash);
        const fwdCdmsList = [];
        if (list) {
            for (let i = 0; i < list.length; i += 1) {
                fwdCdmsList.push(list[i].messageHash);
            }
            this.fwdCdmsList = fwdCdmsList;
        }
        
        for (let i = 0; i < groups.current.members.length; i =+ 1) {
            compose.addTag('ccRecipients', groups.current.members[i]);
        }

        this.sendCdm();
    }

    @action
    savePendingCdm() {
        const { groups } = this.stores;
    }


    @action
    sendCdm3() {
        const { groups, crypto } = this.stores;
        this.sendCdmStatus = 'pending';
        
        return;
        const recipients = groups.current.members;
        const messages = [{
            text: this.message.trim(),
            hash: null,
            type: 'to' // 'to' or 'cc'
        }]  
        crypto.generateCdm(recipients, messages)
            .then(encMessage => {
                const now = moment().unix();
                this.attachmentHash = sha256(encMessage);
                this.list = this.list.concat([{
                    'hash': this.attachmentHash,
                    'message': this.message,
                    'type': 'pending',
                    'timestamp': now
                }]);
                return encMessage;
            })
            .then(encMessage => {
                this.pendnigDB.put(this.attachmentHash, this.message);
                this.message = '';
                return encMessage;
            })
            .then(encMessage => {
                const formConfig = {};
                const formData = new FormData();
                formData.append('data', encMessage);
                return axios.post(`${process.env.API_HOST}/api/v1/ipfs`, formData, formConfig)
                    .then(ipfsData => {
                        return ipfsData;
                    });
            })
            .then(ipfsData => {
                if (typeof window !== 'undefined') {
                    return window.Waves.publicState().then(udata => {
                        const txData = {
                            type: 4,
                            data: {
                                amount: {
                                   assetId: process.env.ASSET_ID,
                                   tokens: "0.00000001"
                                },
                                fee: {
                                    assetId: process.env.ASSET_ID,
                                    tokens: "0.001"
                                },
                                recipient: udata.account.address,
                                attachment: ipfsData.data['Hash']
                            }
                        };
                        return window.WavesKeeper.signAndPublishTransaction(txData).then(data => {
                            return data;
                        }).catch(e => { 
                            console.log(e);
                            if (e.code && e.code === "15") {
                                notification['warning']({
                                    message: 'The message is not sent',
                                    description:
                                        <div>
                                            <p>Plese make sure your account has a positive balance</p>
                                        </div>
                                  });
                            } else if (e.code && e.code === "10") {
                                message.info('Message sending has been canceled');
                            } else {
                                message.error(e.message || e);
                            }
                        });
                    });   
                }
            })
            .then(data => {
                if (!data) {
                    const list = this.list;
                    list.splice(-1, 1);
                    this.list = list;
                    this.updateReadCdmDB();
                    this.pendnigDB.del(this.attachmentHash);
                    this.forwardedList = null;
                }
                this.attachmentHash = null;
                this.sendCdmStatus = 'success'
            })
            .catch(e => {
                console.log(e);
                message.error(e.message || e);
                this.sendCdmStatus = 'error';
            });
    }

    @action
    forwardCdms() {
        const { alice, groups, index, crypto } = this.stores;
        const formConfig = {}

        return;

        if (groups.current === null)  { return }

        this.forwardCdmStatus = 'pending';
        axios
            .get(`${process.env.API_HOST}/api/v1/cdms/${alice.publicKey}/${groups.current.groupHash}`, formConfig)
            .then(res => {
                return res.data.cdms;
            })
            .then(list => {
                return this.decryptList(list, false);
            })
            .then(list => {
                this.forwardedList = list;
                const recipients = toJS(groups.current.members).concat(index.newGroupMembers);
                const messages = list.map(el => {
                    return {
                        text: el.message,
                        hash: el.messageHash
                    }
                });
                
                return crypto.generateCdm(recipients, messages)
                    .then(cdm => {
                        this.attachmentHash = sha256(cdm);
                        return cdm;
                    });
            })
            .then(cdm => {
                const formConfig = {};
                const formData = new FormData();
                formData.append('data', cdm);
                return axios.post(`${process.env.API_HOST}/api/v1/ipfs`, formData, formConfig)
                    .then(ipfsData => {
                        return ipfsData;
                    });
            })
            .then(ipfsData => {
                if (typeof window !== 'undefined') {
                    return window.Waves.publicState().then(udata => {
                        const txData = {
                            type: 4,
                            data: {
                                amount: {
                                   assetId: process.env.ASSET_ID,
                                   tokens: "0.00000001"
                                },
                                fee: {
                                    assetId: process.env.ASSET_ID,
                                    tokens: "0.001"
                                },
                                recipient: udata.account.address,
                                attachment: ipfsData.data['Hash']
                            }
                        };
                        return window.WavesKeeper.signAndPublishTransaction(txData)
                            .then(data => {
                                return data;
                            })
                            .catch(e => { 
                                console.log(e);
                                if (e.code && e.code === "15") {
                                    notification['warning']({
                                        message: 'The message is not sent',
                                        description:
                                            <div>
                                                <p>Plese make sure your account has a positive balance</p>
                                            </div>
                                    });
                                } else if (e.code && e.code === "10") {
                                    message.info('Message sending has been canceled');
                                } else {
                                    message.error(e.message || e);
                                }
                            });
                    });   
                }
            })
            .then(data => {
                if (data) {
                    groups.setGroup(groups.newGroups[0]);
                    const pendingCdms = [];
                    for (let i = 0; i < this.forwardedList.length; i += 1) {
                        const listEl = this.forwardedList[i];
                        const message = listEl.message.replace(/@[\w]{64}$/gmi, "");
                        this.pendnigDB.put(this.attachmentHash, message);
                        this.readCdmDB.put(groups.current.groupHash, this.forwardedList.length);

                        const now = moment().unix();
                        pendingCdms.push({
                            'hash': this.attachmentHash,
                            'message': message,
                            'type': 'pending',
                            'timestamp': now
                        });
                    }
                    
                    this.list = pendingCdms;
                    index.resetNewGroupMember();
                    index.showNewGroupMembersModal = false;

                } else {
                    groups.newGroups = [];
                }
                this.attachmentHash = null;
                this.forwardCdmStatus = 'success';
            })
            .catch(e => {
                console.log(e);
                message.error(e.message || e);
                this.forwardCdmStatus = 'error';
            });
    }
}

export default CdmStore;

