import { action, observable, toJS } from 'mobx';
import axios from 'axios';
import * as moment from 'moment';
import base58 from './../utils/base58';
const { transfer, broadcast } = require('@waves/waves-transactions')
import stringFromUTF8Array from './../utils/batostr';
import { message } from 'antd';


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
        const { utils } = this.stores;

        this.readCdmDB = levelup(leveljs(`/root/.leveldb/read_cdm`));
        this.pendingTimestampsDB = levelup(leveljs(`/root/.leveldb/pending_timestamps_${alicePubKey}_${utils.addressFromPublicKey(bobPubKey)}`));
        this.pendingMessagesDB = levelup(leveljs(`/root/.leveldb/pending_messages_${alicePubKey}_${utils.addressFromPublicKey(bobPubKey)}`));
    }

    @action
    getList() {
        const { alice, bob } = this.stores;
        const formConfig = {}
        const self = this;
        this.getListStatus = 'fetching';

        if (alice.publicKey === null || alice.publicKey === null) {
            return;
        }
        axios
            .get(`${process.env.API_HOST}/api/v1/cdm/${alice.publicKey}/${bob.publicKey}`, formConfig)
            .then(res => {
                return this.decryptList(res.data.cdms);
            })
            .then(list => {
                this.readCdmDB.put(bob.publicKey, Buffer.from(list.length.toString()));
                this.list = list;
                this.getListStatus = 'success';
            }) 
            .then(() => {
                const currentBob = bob.list.filter(el => el.accounts[0].publicKey === bob.publicKey)[0];
                if (currentBob.index === 0) {
                    bob.fullName = 'Saved Messages';
                } else {
                    bob.firstNameEdit = currentBob.accounts[0].firstName;
                    bob.lastNameEdit = currentBob.accounts[0].lastName;
                    bob.fullName = [currentBob.accounts[0].firstName, currentBob.accounts[0].lastName].join(' ').trim();
                }
            })
            .then(() => {
                for (let i = 0; i < this.list.length; i += 1) {
                    this.pendingTimestampsDB.del(this.list[i].txId);
                    this.pendingMessagesDB.del(this.list[i].txId);      
                }
            })
            .then(() => {          
                self.pendingTimestampsDB.createReadStream()
                    .on('data', data => {
                        const txId = stringFromUTF8Array(data.key);
                        const timestamp = stringFromUTF8Array(data.value);

                        self.pendingMessagesDB.get(txId, (err, res) => {  
                            if (err) { return }
                            const message = stringFromUTF8Array(res);
                            this.list = this.list.concat([{
                                'txId': txId,
                                'message': message,
                                'type': 'pending',
                                'timestamp': timestamp
                            }]);
                        });
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
        
        const self = this;
        const { cdm, bob, crypto, utils } = this.stores;
        this.sendCdmStatus = 'pending';

        crypto.encryptMessage([bob.publicKey])
            .then(ecnMessage => {
                const formConfig = {};
                const formData = new FormData();
                formData.append('message', ecnMessage);
                formData.append('recipient', bob.publicKey);

                return axios
                    .post(`${process.env.API_HOST}/api/v1/cdm`, formData, formConfig)
                    .then(res => {
                        return res.data.tx;
                    })
            })
            .then(tx => {
                const now = moment().unix();
                self.pendingTimestampsDB.put(tx.id, Buffer.from(now.toString()));
                self.pendingMessagesDB.put(tx.id, Buffer.from(this.message));
                self.readCdmDB.put(bob.publicKey, cdm.list.length + 1);
                return tx;
            })
            .then(tx => {
                const now = moment().unix();
                self.list = self.list.concat([{
                    'txId': tx.id,
                    'message': self.message,
                    'type': 'pending',
                    'timestamp': now
                }]);

                self.message = '';
                self.sendCdmStatus = 'success'
            })
            .catch(e => {
                message.error(e.message || e);
                self.sendCdmStatus = 'error';
            });
    }
}

export default CdmStore;

