import { action, observable } from 'mobx';

class LoginStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @observable withWaves = null;
}

export default LoginStore;

