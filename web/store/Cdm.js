import { action, observable } from 'mobx';
import axios from 'axios';
import * as moment from 'moment';
import { message } from 'antd';
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

    @observable list = [];
    @observable getListStatus = 'init';
    @observable message = '';
    @observable sendCdmStatus = 'init';
    @observable readCdmDB = null;
    @observable pendingTimestampsDB = null;
    @observable pendingMessagesDB = null;
    
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

        const currentGroup = groups.currentGroup();
        if (currentGroup === null) { return }
        this.list = [currentGroup.lastCdm];

        this.getListStatus = 'fetching';
        axios
            .get(`${process.env.API_HOST}/api/v1/cdms/${alice.publicKey}/${currentGroup.members[0].publicKey}`, formConfig)
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
                this.readCdmDB.put(groups.groupHash, list.length);
                this.list = list;
                this.getListStatus = 'success';
            })
            .then(() => {
                this.pendnigDB.createReadStream()
                    .on('data', data => {
                        const attachmentHash = stringFromUTF8Array(data.key);
                        const message = stringFromUTF8Array(data.value);
                        const now = moment().unix();
                        this.list = this.list.concat([{
                            'hash': attachmentHash,
                            'message': message,
                            'type': 'pending',
                            'timestamp': now
                        }]);
                        // this.pendnigDB.del(attachmentHash);
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
        const currentGroup = groups.currentGroup();

        const decList = [];
        const promices = [];
        for (let i = 0; i < list.length; i += 1) {
            const cdm = list[i];
            const p = crypto.decryptMessage(cdm.message, currentGroup.members[0].publicKey)
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
        
        const currentGroup = groups.currentGroup();
        if (currentGroup === null) { return }
        const recipients = currentGroup.members.map(el => el.publicKey);
        
        crypto.encryptCdm(recipients)
            .then(ecnMessage => {
                const now = moment().unix();
                this.list = this.list.concat([{
                    'hash': sha256(ecnMessage),
                    'message': this.message,
                    'type': 'pending',
                    'timestamp': now
                }]);

                return ecnMessage;
            })
            .then(ecnMessage => {
                this.pendnigDB.put(sha256(ecnMessage), this.message);
                this.message = '';
                return ecnMessage;
            })
            .then(ecnMessage => {
                const promises = [];
                for (let i = 0 ; i < recipients.length; i += 1) {
                    const formConfig = {};
                    const formData = new FormData();
                    formData.append('message', ecnMessage);
                    formData.append('recipient', recipients[i]);
                    const p = axios.post(`${process.env.API_HOST}/api/v1/cdms`, formData, formConfig);
                    promises.push(p);
                }

                Promise.all(promises);
            })
            .then(_ => {
                this.readCdmDB.put(groups.groupHash, this.list.length);
            })
            .then(_ => {
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

