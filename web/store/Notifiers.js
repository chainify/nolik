import { action, observable } from 'mobx';
import { message, notification, Button } from 'antd';

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

  @action
  demoMode() {
    const { chat } = this.stores;
    const key = `open${Date.now()}`;
    const btn = (
      <Button
        type="primary"
        size="default"
        onClick={() => {
          chat.writeToNolik();
          notification.close(key);
        }}
      >
        Contact Founder
      </Button>
    );
    notification.info({
      duration: 7,
      message: 'Nolik is in demo mode',
      description:
        "It means that you can't export your backup phrase and share your address. To try out Nolik send a message to Founder.",
      key,
      btn,
    });
  }
}

export default NotifiersStore;
