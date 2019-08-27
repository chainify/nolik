import Index from './Index';
import Alice from './Alice';
import Threads from './Threads';
import Cdms from './Cdms';
import Utils from './Utils';
import Crypto from './Crypto';
import Wrapper from './Wrapper';
import Contacts from './Contacts';
import Login from './Login';
import Heartbeat from './Heartbeat';
import Compose from './Compose';
import Notifiers from './Notifiers';
import Chat from './Chat';

const stores = {};

stores.alice = new Alice(stores);
stores.threads = new Threads(stores);
stores.utils = new Utils(stores);
stores.crypto = new Crypto(stores);
stores.wrapper = new Wrapper(stores);
stores.index = new Index(stores);
stores.cdms = new Cdms(stores);
stores.contacts = new Contacts(stores);
stores.login = new Login(stores);
stores.heartbeat = new Heartbeat(stores);
stores.compose = new Compose(stores);
stores.notifiers = new Notifiers(stores);
stores.chat = new Chat(stores);

export default stores;
