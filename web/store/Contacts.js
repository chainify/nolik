import { action, observable } from 'mobx';
import stringFromUTF8Array from './../utils/batostr';

class WrapperStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;

        this.initLevelDB = this.initLevelDB.bind(this);
        this.saveContact = this.saveContact.bind(this);
        this.getContact = this.getContact.bind(this);
    }

    @observable list = [];
    @observable fullNameEdit = '';
    @observable searchValue = '';
    @observable contactsDB = null;

    @action
    initLevelDB() {
        const { alice } = this.stores;
        const levelup = require('levelup');
        const leveljs = require('level-js');

        this.contactsDB = levelup(leveljs(`/root/.leveldb/contacts_${alice.publicKey}`));
    }

    @action
    saveContact() {
        const { groups, index } = this.stores;
        this.contactsDB.put(groups.current.groupHash, this.fullNameEdit);
        groups.setFullName(this.fullNameEdit);
    }

    @action
    getContact(groupHash) {
        this.initLevelDB();
        return new Promise((resolve, reject) => {
            this.contactsDB.get(groupHash)
                .then(res => {
                    resolve(stringFromUTF8Array(res));
                })
                .catch(e => {
                    if (e.type === 'NotFoundError') {
                        resolve(null);
                    } else {
                        reject(e);
                    }
                });
        })
    }
}

export default WrapperStore;

