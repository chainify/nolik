import { action, observable } from 'mobx';
import axios from 'axios';
import * as moment from 'moment';
import { message, notification } from 'antd';
import { sha256 } from 'js-sha256';
import { toJS } from 'mobx';
import stringFromUTF8Array from '../utils/batostr';

class CdmStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.getList = this.getList.bind(this);
        this.decryptList = this.decryptList.bind(this);
        this.sendCdm = this.sendCdm.bind(this);
        this.toggleCompose = this.toggleCompose.bind(this);
    }

    @observable list = null;
    @observable message = '';
    @observable composeMode = false;
    @observable composeCcOn = false;

    @observable getListStatus = 'init';
    @observable sendCdmStatus = 'init';
    @observable forwardCdmStatus = 'init';
    
    // @observable readCdmDB = null;
    @observable listDB = null;
    @observable pendnigDB = null;
    
    @action
    initLevelDB() {
        const { alice, groups } = this.stores;
        const levelup = require('levelup');
        const leveljs = require('level-js');

        // this.readCdmDB = levelup(leveljs(`/root/.leveldb/read_cdms_${alice.publicKey}`));
        this.listDB = levelup(leveljs(`/root/.leveldb/list_cdms_${alice.publicKey}_${groups.current.groupHash}`));
        this.pendnigDB = levelup(leveljs(`/root/.leveldb/pending_cdms_${alicePubKey}_${groups.current.groupHash}`));
    }

    @action
    toggleCompose() {
        this.composeMode = !this.composeMode;
        if (this.composeMode === false) {
            this.composeCcOn = false;
        }
    }


    @action
    getList() {
        const { alice, groups, contacts } = this.stores;
        const formConfig = {}

        if (groups.current === null)  { return }

        this.getListStatus = 'fetching';
        axios
            .get(`${process.env.API_HOST}/api/v1/cdms/${alice.publicKey}/${groups.current.groupHash}`, formConfig)
            .then(res => {
                return res.data.cdms;
            })
            .then(list => {
                return this.decryptList(list);
            })
            .then(list => {
                
            })
            .catch(e => {
                console.log(e);
                this.getListStatus = 'error';
            })
    }


    @action
    decryptList(list, clearHash = true) {
        const { crypto, groups, alice } = this.stores;

        if (list.length === 0) { return list }
        const decList = [];
        const promices = [];
        for (let i = 0; i < list.length; i += 1) {
            const listEl = list[i];
            const p = crypto.decryptMessage(listEl.message, listEl.logicalSender, clearHash)
                .then(msg => {
                    listEl.message = msg;
                    decList.push(listEl);
                })
            promices.push(p);
        }
        return Promise.all(promices)
            .then(_ => {
                return decList;
            })
            .catch(e => {
                message.error(e.message || e);
            });
    }

    @action
    sendCdm() {
        const { groups, crypto } = this.stores;
        this.sendCdmStatus = 'pending';
        
        return;
        const recipients = groups.current.members;
        const messages = [{
            text: this.message.trim(),
            hash: null
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
                        hash: el.hash
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

