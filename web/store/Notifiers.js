import { action, observable } from 'mobx';
import { message, notification } from 'antd';

class NotifiersStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
  }

  @observable sound = null;

  @action
  info(text) {
    message.info(text);
  }

  @action
  success(text) {
    message.success(text);
  }

  @action
  warning(text) {
    message.warn(text);
  }

  @action
  error(e) {
    message.error(e.message || e);
  }

  @action
  passwordHint(hint) {
    if (hint) {
      notification.info({
        duration: 3,
        message: 'Your password hint',
        description: `${hint}`,
      });
    } else {
      notification.warn({
        duration: 3,
        message: 'Unfortunately password hint was not provided',
      });
    }
  }

  @action
  passwordForgot() {
    notification.info({
      duration: 7,
      message: 'Password recovery',
      description: `It is sad to say, but we will not be able to restore your password because at Nolik we do not store your passwords, decryption keys or any personal data.`,
    });
  }
}

export default NotifiersStore;
