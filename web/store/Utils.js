import { action, observable } from 'mobx';
import * as WavesAPI from 'waves-api';

class AliceStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.sleep = this.sleep.bind(this);
    }

    @action
    sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));    
    }

    @action
    addressFromPublicKey(publicKey) {
        const Waves = WavesAPI.create(WavesAPI.TESTNET_CONFIG);
        return Waves.tools.getAddressFromPublicKey(publicKey);
    }
}

export default AliceStore;

