import App from './App';
import Index from './Index';
import Notifiers from './Notifiers';
import Threads from './Threads';
import Utils from './Utils';
import Menu from './Menu';
import Heartbeat from './Heartbeat';
import Crypto from './Crypto';
import Chat from './Chat';
import Cdms from './Cdms';

const stores = {};

stores.app = new App(stores);
stores.index = new Index(stores);
stores.notifiers = new Notifiers(stores);
stores.threads = new Threads(stores);
stores.utils = new Utils(stores);
stores.menu = new Menu(stores);
stores.heartbeat = new Heartbeat(stores);
stores.crypto = new Crypto(stores);
stores.chat = new Chat(stores);
stores.cdms = new Cdms(stores);

export default stores;
