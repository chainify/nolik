import { action, observable } from 'mobx';
import { message, notification, Button } from 'antd';

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

    selfClearedChat() {
        notification['info']({
            duration: null,
            message: 'Chat has been cleared',
            description:
                <div>
                    <p>
                        At Nolik we do not store your decryption keys and your messages cannot be recovered.
                        To start new chat please reload the page.
                    </p>
                    <Button
                        type="primary"
                        onClick={_ => {
                            location.reload();
                        }}
                    >
                        Reload page
                    </Button>
                </div>
        });
    }

    outerClearedChat() {
        notification['info']({
            duration: null,
            message: 'Chat has been cleared',
            description:
                <div>
                    <p>
                        The chat has been cleared by your interlocutor.
                        At Nolik we do not store your decryption keys and your messages cannot be recovered.
                        To start new chat please reload the page.
                    </p>
                </div>
        });
    }

    encryptionOk() {
        notification['success']({
            duration: 3,
            placement: 'bottomLeft',
            message: 'Security',
            description:
                <div>
                    <p>
                        Encryption keys has been successfully generated
                    </p>
                </div>
        });
    }
}

export default NotifiersStore;

