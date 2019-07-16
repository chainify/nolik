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
        const { groups } = this.stores;
        this.contactsDB.put(groups.current.groupHash, this.fullNameEdit);
        groups.setFullName(this.fullNameEdit);
    }

    @action
    getList() {
        const { groups } = this.stores;
        this.initLevelDB();
        this.list = [];
        this.contactsDB.createReadStream()
            .on('data', data => {
                const groupHash = stringFromUTF8Array(data.key);
                const fullName = stringFromUTF8Array(data.value);

                let publicKey = null;
                const filtered = groups.list.filter(el => el.groupHash === groupHash);

                if (filtered.length > 0) {
                    const current = filtered[0];
                    if (current.members.length === 1) {
                        publicKey = current.members[0].publicKey;
                    }
                }

                this.list.push({
                    groupHash,
                    fullName,
                    publicKey
                })
            });
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

