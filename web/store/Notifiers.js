import { action } from 'mobx';
import { message } from 'antd';

class NotifiersStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
  }

  @action
  info(text) {
    message.info(text);
  }

  @action
  success(text) {
    message.success(text);
  }

  @action
  error(e) {
    message.error(e.message || e);
  }
}

export default NotifiersStore;
