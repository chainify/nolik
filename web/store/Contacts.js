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
    @observable list = null;

    @observable getContactStatus = 'init';

    @action
    saveContact() {
        
    }

    @action
    getContacts() {
        const { alice } = this.stores;
        const formConfig = {};
        
        this.getContactStatus = 'fetching';
        axios
            .get(`${process.env.API_HOST}/api/v1/contacts/${alice.publicKey}`, formConfig)
            .then(res => {
                this.list = res.data.contacts;
                this.getContactStatus = 'success';
            }) 
    }
}

export default WrapperStore;

