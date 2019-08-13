import { action, observable } from 'mobx';
import stringFromUTF8Array from './../utils/batostr';
import { autorun, toJS } from 'mobx';

class WrapperStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;

        this.initLevelDB = this.initLevelDB.bind(this);
        this.saveContact = this.saveContact.bind(this);
        this.getContact = this.getContact.bind(this);

        autorun(() => {
            if (this.currentPublicKey !== null) {
                this.getContact(this.currentPublicKey)
                    .then(name => {
                        this.currentFullName = name || this.currentPublicKey;
                    })
            }
        })
    }

    @observable list = [];
    @observable threadFullName = '';
    @observable contactFullName = '';
    @observable searchValue = '';
    @observable contactsDB = null;
    @observable currentPublicKey = null;
    @observable currentFullName = '';

    @action
    initLevelDB() {
        const { alice } = this.stores;
        const levelup = require('levelup');
        const leveljs = require('level-js');

        this.contactsDB = levelup(leveljs(`/root/.leveldb/contacts_${alice.publicKey}`));
    }

    @action
    saveContact(key, name) {
        this.contactsDB.put(key, name);
        this.getList();
    }

    saveThread() {
        const { threads } = this.stores;
        this.saveContact(threads.current.threadHash, this.threadFullName);
        threads.setThreadFullName(this.threadFullName);
    }

    @action
    getList() {
        this.initLevelDB();
        const list = [];
        this.contactsDB.createReadStream()
            .on('data', data => {
                const publicKey = stringFromUTF8Array(data.key);
                const fullName = stringFromUTF8Array(data.value);

                list.push({
                    fullName,
                    publicKey
                });
            })
            .on('end', _ => {
                this.list = list;
            })   
    }

    @action
    getContact(key) {
        this.initLevelDB();
        return new Promise((resolve, reject) => {
            this.contactsDB.get(key)
                .then(res => {
                    resolve(stringFromUTF8Array(res));
                })
                .catch(e => {
                    if (e.direction === 'NotFoundError') {
                        resolve(null);
                    } else {
                        reject(e);
                    }
                });
        })
    }
}

export default WrapperStore;

