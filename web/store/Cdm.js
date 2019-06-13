import { action, observable, toJS } from 'mobx';
import axios from 'axios';
import * as moment from 'moment';
import base58 from './../utils/base58';
const { transfer, broadcast } = require('@waves/waves-transactions')
import stringFromUTF8Array from './../utils/batostr';
import { message } from 'antd';
import { sha256 } from 'js-sha256';


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
    initLevelDB(alicePubKey, bobPubKey) {
        const levelup = require('levelup');
        const leveljs = require('level-js');

        this.readCdmDB = levelup(leveljs(`/root/.leveldb/read_cdms_${alicePubKey}`));
        this.pendnigDB = levelup(leveljs(`/root/.leveldb/pending_cdms_${alicePubKey}_${bobPubKey}`));
    }

    @action
    getList() {
        const { alice, bob } = this.stores;
        const formConfig = {}
        this.getListStatus = 'fetching';

        axios
            .get(`${process.env.API_HOST}/api/v1/cdm/${alice.publicKey}/${bob.publicKey}`, formConfig)
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
                this.readCdmDB.put(bob.publicKey, list.length);
                this.list = list;
                this.getListStatus = 'success';
            })
            .then(() => {
                const currentBob = bob.list && bob.list.filter(el => el.accounts[0].publicKey === bob.publicKey)[0];
                if (currentBob) {
                    if (currentBob.index === 0) {
                        bob.fullName = 'Saved Messages';
                    } else {
                        bob.firstNameEdit = currentBob.accounts[0].firstName;
                        bob.lastNameEdit = currentBob.accounts[0].lastName;
                        bob.fullName = [currentBob.accounts[0].firstName, currentBob.accounts[0].lastName].join(' ').trim();
                    }
                }
            })
            .then(() => {
                this.pendnigDB.createReadStream()
                    .on('data', data => {
                        const ecnMessage = stringFromUTF8Array(data.key);
                        const message = stringFromUTF8Array(data.value);
                        const now = moment().unix();
                        this.list = this.list.concat([{
                            'hash': ecnMessage,
                            'message': message,
                            'type': 'pending',
                            'timestamp': now
                        }]);
                        // this.pendnigDB.del(ecnMessage);
                    })
            })
            .catch(e => {
                console.log(e);
                this.getListStatus = 'error';
            })
    }


    @action
    decryptList(list) {
        const { bob, crypto } = this.stores;
        const decList = [];
        const promices = [];
        for (let i = 0; i < list.length; i += 1) {
            const cdm = list[i];
            const p = crypto.decryptMessage(cdm.message, bob.publicKey)
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
        const { cdm, bob, crypto, utils } = this.stores;
        this.sendCdmStatus = 'pending';

        crypto.encryptCdm([bob.publicKey])
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
                const recipients = [bob.publicKey];
                const promises = [];
                for (let i = 0 ; i < recipients.length; i += 1) {
                    const formConfig = {};
                    const formData = new FormData();
                    formData.append('message', ecnMessage);
                    formData.append('recipient', bob.publicKey);
                    const p = axios.post(`${process.env.API_HOST}/api/v1/cdm`, formData, formConfig);
                }

                Promise.all(promises);
            })
            .then(_ => {
                this.readCdmDB.put(bob.publicKey, this.list.length);
            })
            .then(_ => {
                this.sendCdmStatus = 'success'
            })
            .catch(e => {
                console.log(e);
                message.error(e.message || e);
                self.sendCdmStatus = 'error';
            });
    }
}

export default CdmStore;

