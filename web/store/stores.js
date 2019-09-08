import App from './App';
import Index from './Index';
import Notifiers from './Notifiers';
import Threads from './Threads';
import Utils from './Utils';
import Menu from './Menu';

const stores = {};

stores.app = new App(stores);
stores.index = new Index(stores);
stores.notifiers = new Notifiers(stores);
stores.threads = new Threads(stores);
stores.utils = new Utils(stores);
stores.menu = new Menu(stores);

export default stores;
