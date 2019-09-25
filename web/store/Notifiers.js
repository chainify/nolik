import { action } from 'mobx';
import { message, notification } from 'antd';

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

  @action
  passwordHint(hint) {
    const { app } = this.stores;
    notification.info({
      duration: 3,
      message: 'Password hint',
      description:
        hint === ''
          ? 'Unfortunately password hint was not provided'
          : `Your  hint is: ${hint}`,
    });
  }
}

export default NotifiersStore;
