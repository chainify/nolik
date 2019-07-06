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
    @observable getListStatus = 'init';
    @observable message = '';
    @observable messageHash = null;
    @observable sendCdmStatus = 'init';
    @observable readCdmDB = null;
    @observable pendingTimestampsDB = null;
    @observable pendingMessagesDB = null;
    @observable textareaFocused = false;
    
    @action
    initLevelDB(alicePubKey, groupHash) {
        const levelup = require('levelup');
        const leveljs = require('level-js');

        this.readCdmDB = levelup(leveljs(`/root/.leveldb/read_cdms_${alicePubKey}`));
        this.pendnigDB = levelup(leveljs(`/root/.leveldb/pending_cdms_${alicePubKey}_${groupHash}`));
    }

    @action
    getList() {
        const { alice, groups } = this.stores;
        const formConfig = {}

        if (groups.current === null)  { return }

        this.getListStatus = 'fetching';
        axios
            .get(`${process.env.API_HOST}/api/v1/cdms/${alice.publicKey}/${groups.current.members[0].publicKey}`, formConfig)
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
                this.readCdmDB.put(groups.current.groupHash, list.length);
                this.list = list;
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
                        this.pendnigDB.del(attachmentHash);
                    })
            })
            .catch(e => {
                console.log(e);
                this.getListStatus = 'error';
            })
    }


    @action
    decryptList(list) {
        const { crypto, groups } = this.stores;

        if (list.length === 0) { return list }
        const decList = [];
        const promices = [];
        for (let i = 0; i < list.length; i += 1) {
            const cdm = list[i];
            const p = crypto.decryptMessage(cdm.message, groups.current.members[0].publicKey)
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
        const { groups, alice, crypto } = this.stores;
        this.sendCdmStatus = 'pending';
        const recipients = groups.current.members.map(el => el.publicKey);

        crypto.generateCdm(recipients)
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
                this.pendnigDB.put(this.messageHash, this.message);
                this.readCdmDB.put(groups.current.groupHash, this.list ? this.list.length : 0);
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
}

export default CdmStore;

