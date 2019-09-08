import { action, observable } from 'mobx';

class ThreadsStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
  }

  @observable list = null;
  @observable current = null;
}

export default ThreadsStore;
