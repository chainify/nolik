import { action, observable } from 'mobx';

class AppStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
  }
}

export default AppStore;
