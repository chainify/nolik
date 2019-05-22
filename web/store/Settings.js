import { action, observable } from 'mobx';
import axios from 'axios';
import * as WavesAPI from 'waves-api';

class WrapperStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @observable seed = 'before scare used stool jump book banana opinion body cattle entire syrup fog they switch';
}

export default WrapperStore;

