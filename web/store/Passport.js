import { action, observable } from 'mobx';
import axios from 'axios';

class PassportStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.getPassport = this.getPassport.bind(this);
    }

    @observable id = null;
    @observable tx = null;
    @observable getPassportStatus = 'init';

    @action
    getPassport() {
        const { user } = this.stores;
        this.getPassportStatus = 'fetching';

        const formConfig = {
            headers: {
                // 'Authorization': `Bearer ${user.authToken}`,
                // 'From': user.id,
            },
        };
        
        axios
            .get(`${process.env.API_HOST}/api/v1/transactions/${this.id}`, formConfig)
            .then(res => {
                this.tx = res.data.tx;
                this.getPassportStatus = 'success';
            })
            .catch(e => {
                this.getPassportStatus = 'error';
            });
    }
}

export default PassportStore;
