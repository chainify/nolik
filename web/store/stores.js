import Index from './Index';
import Alice from './Alice';
import Groups from './Groups';
import Cdm from './Cdm';
import Utils from './Utils';
import Crypto from './Crypto';
import Wrapper from './Wrapper';
import Contacts from './Contacts';
import Login from './Login';

const stores = {};

stores.alice = new Alice(stores);
stores.groups = new Groups(stores);
stores.utils = new Utils(stores);
stores.crypto = new Crypto(stores);
stores.wrapper = new Wrapper(stores);
stores.index = new Index(stores);
stores.cdm = new Cdm(stores);
stores.contacts = new Contacts(stores);
stores.login = new Login(stores);

export default stores;
