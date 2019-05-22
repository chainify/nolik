import Passport from './Passport';
import Index from './Index';
import Alice from './Alice';
import Bob from './Bob';
import Cdm from './Cdm';
import Utils from './Utils';
import Crypto from './Crypto';
import Wrapper from './Wrapper';
import Settings from './Settings';
import Contacts from './Contacts';

const stores = {};

stores.passport = new Passport(stores);
stores.alice = new Alice(stores);
stores.bob = new Bob(stores);
stores.utils = new Utils(stores);
stores.crypto = new Crypto(stores);
stores.wrapper = new Wrapper(stores);
stores.index = new Index(stores);
stores.cdm = new Cdm(stores);
stores.settings = new Settings(stores);
stores.contacts = new Contacts(stores);

export default stores;
