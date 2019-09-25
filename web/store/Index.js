import { action, observable } from 'mobx';

class AppStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
    this.toggleMenu = this.toggleMenu.bind(this);
  }

  @observable showMenu = false;

  @action
  toggleMenu() {
    this.showMenu = !this.showMenu;
  }
}

export default AppStore;
