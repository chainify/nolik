import { action, observable } from 'mobx';
import { message, notification } from 'antd';

class NotifiersStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @observable withWaves = null;

    @action
    keeper(e) {
        if (e.code && e.code === "15") {
            notification['warning']({
                message: 'The message is not sent',
                description:
                    <div>
                        <p>Plese make sure your account has a positive balance</p>
                    </div>
              });
        } else if (e.code && e.code === "10") {
            this.info('Message sending has been canceled');
        } else {
            this.error(e.message || e);
        }
    }

    @action
    info(message) {
        message.info(message);
    }

    @action
    success(message) {
        message.success(message);
    }

    @action
    error(e) {
        message.error(e.message || e);
    }
}

export default NotifiersStore;

