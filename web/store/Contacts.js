import { action, observable } from 'mobx';
import axios from 'axios';
import * as WavesAPI from 'waves-api';

class WrapperStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;

        this.saveContact = this.saveContact.bind(this);
        this.getContacts = this.getContacts.bind(this);
    }
    @observable seed = '';
    @observable list = null;
    @observable name = '';
    @observable publicKey = '';
    @observable contactsDB = null;

    @observable saveContactStatus = 'init';

    @action
    initLevelDB() {
        const levelup = require('levelup');
        const leveljs = require('level-js');

        this.contactsDB = levelup(leveljs(`/root/.data/leveldb/contacts`));
    }

    @action
    saveContact() {
        this.saveContactStatus = 'fetching';
        this.contactsDB.put(this.publickKey, Buffer.from(this.name))
            .then(() => {
                this.saveContactStatus = 'success';
            });
    }

    @action
    getContacts() {
        const { utils } = this.stores;
        this.contactsDB.createReadStream()
            .on('data', data => {
                const publickKey = stringFromUTF8Array(data.publickKey);
                const name = stringFromUTF8Array(data.name);

                this.list = this.list.concat({
                    publickKey,
                    name,
                    address: utils.addressFromPublicKey(publickKey)
                })
            })
    }
}

export default WrapperStore;

