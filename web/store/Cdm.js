import { action, observable } from 'mobx';
import axios from 'axios';
import * as moment from 'moment';
import { message, notification } from 'antd';
import { sha256 } from 'js-sha256';
import { toJS } from 'mobx';
import stringFromUTF8Array from './../utils/batostr';

class CdmStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.getList = this.getList.bind(this);
        this.decryptList = this.decryptList.bind(this);
        this.sendCdm = this.sendCdm.bind(this);
    }

    @observable list = null;
    @observable lastCdmHash = null;
    @observable getListStatus = 'init';
    @observable message = '';
    @observable messageHash = null;
    @observable sendCdmStatus = 'init';
    @observable forwardCdmStatus = 'init';
    @observable getLastCdmStatus = 'init';
    @observable readCdmDB = null;
    @observable pendingTimestampsDB = null;
    @observable pendingMessagesDB = null;
    @observable textareaFocused = false;
    @observable forwardedList = null;
    
    @action
    initLevelDB(alicePubKey, groupHash) {
        const levelup = require('levelup');
        const leveljs = require('level-js');

        this.readCdmDB = levelup(leveljs(`/root/.leveldb/read_cdms_${alicePubKey}`));
        this.pendnigDB = levelup(leveljs(`/root/.leveldb/pending_cdms_${alicePubKey}_${groupHash}`));
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
                const list = res.data.cdms;
                for (let i = 0; i < list.length; i += 1) {
                    this.pendnigDB.del(list[i].attachmentHash);
                }
                return list;
            })
            .then(list => {
                return this.decryptList(list);
            })
            .then(list => {
                const  promices = [];
                for (let i = 0; i < list.length; i += 1) {
                    const listEl = list[i];
                    const p = contacts.getContact(listEl.logicalSender)
                        .then(fullName => {
                            listEl.senderName = fullName || listEl.logicalSender;
                            return listEl;
                        })
                    promices.push(p);
                }

                return Promise.all(promices)
                    .then(res => {
                        return res;
                    })
            })
            .then(list => {
                if (this.list && this.list.length === list.length) {
                    for (let i = 0; i < list.length; i += 1) {
                        if (this.list[i].type === 'pending') {
                            const listEl = list.filter(el => el.attachmentHash === this.list[i].hash);
                            if (listEl.length > 0) {
                                this.list[i].type = 'outgoing';
                            }
                        }
                    }
                    return null;
                } else {
                    return list;
                }
            })
            .then(list => {
                if (list) { this.list = list }
                this.readCdmDB.put(groups.current.groupHash, this.list.length);
                const groupIndex = groups.list.filter(el => el.groupHash === groups.current.groupHash)[0].index;
                groups.list[groupIndex].readCdms = this.list.length;
                this.getListStatus = 'success';
            })
            .then(() => {
                this.pendnigDB.createReadStream()
                    .on('data', data => {
                        const attachmentHash = stringFromUTF8Array(data.key);
                        const message = stringFromUTF8Array(data.value);
                        const now = moment().unix();

                        const count = this.list.filter(el => el.attachmentHash  === attachmentHash);
                        if (count.length === 0) {
                            this.list = this.list.concat([{
                                'hash': attachmentHash,
                                'message': message,
                                'type': 'pending',
                                'timestamp': now
                            }]);
                        }
                        // this.pendnigDB.del(attachmentHash);
                    })
                    .on('end', _ => {
                        this.list = this.list;
                    })
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
            const cdm = list[i];
            const p = crypto.decryptMessage(cdm.message, cdm.logicalSender, clearHash)
                .then(msg => {
                    cdm.message = msg;
                    decList.push(cdm);
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
        if (groups.current === null) {
            if (groups.searchedList.length > 0) {
                groups.current = groups.searchedList[0];
            } else {
                return;
            }
        }
        const recipients = groups.current.members;
        crypto.generateCdm(recipients, this.message)
            .then(encMessage => {
                const now = moment().unix();
                this.messageHash = sha256(encMessage);
                this.list = this.list.concat([{
                    'hash': this.messageHash,
                    'message': this.message,
                    'type': 'pending',
                    'timestamp': now
                }]);
                return encMessage;
            })
            .then(encMessage => {
                const readCdms = this.list ? this.list.length : 0;
                this.pendnigDB.put(this.messageHash, this.message);
                this.readCdmDB.put(groups.current.groupHash, readCdms);

                const groupIndex = groups.list.filter(el => el.groupHash === groups.current.groupHash)[0].index;
                groups.list[groupIndex].readCdms = readCdms;
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
                    this.readCdmDB.put(groups.current.groupHash, this.list.length);
                    this.pendnigDB.del(this.messageHash);
                    this.forwardedList = '';
                }
                this.messageHash = null;
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
                return crypto.generateForwardCdm(recipients, list)
                    .then(cdm => {
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
                        // this.pendnigDB.put(listEl.attachmentHash, message);
                        this.readCdmDB.put(groups.current.groupHash, this.forwardedList.length);

                        const now = moment().unix();
                        pendingCdms.push({
                            'hash': listEl.attachmentHash,
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

