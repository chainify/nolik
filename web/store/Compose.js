import { action, observable } from 'mobx';
import { message } from 'antd';
import { crypto } from '@waves/ts-lib-crypto';
const { verifyPublicKey } = crypto({output: 'Base58'});
 

class ComposeStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.toggleCompose = this.toggleCompose.bind(this);
    }

    @observable inputTo = '';
    @observable inputCc = '';
    @observable subject = '';
    @observable message = '';
    @observable toRecipients = [];
    @observable ccRecipients = [];

    @observable composeMode = false;
    @observable composeCcOn = false;

    
    @action
    toggleCompose() {
        this.composeMode = !this.composeMode;
        if (this.composeMode === false) {
            this.resetCompose();
        }
    }

    @action
    resetCompose() {
        this.composeCcOn = false;
        this.inputTo = '';
        this.inputCc = '';
        this.message = '';
        this.subject = '';
        this.toRecipients = [];
        this.ccRecipients = [];
    }

    @action
    addTag(toArray, tagText) {
        if (
            this.toRecipients.indexOf(tagText) > -1 ||
            this.ccRecipients.indexOf(tagText) > -1)
        {
            message.info('Recipient is already in the list');
            return;
        }
        
        let isValidPublicKey = false;
        try {
            isValidPublicKey = verifyPublicKey(tagText);
        } catch (e) {}

        if (!isValidPublicKey) {
            message.info('Public Key is not valid');
            return;
        }

        if (toArray === 'toRecipients') {
            this.toRecipients = this.toRecipients.concat([tagText]);
            this.inputTo = '';
        }

        if (toArray === 'ccRecipients') {
            this.ccRecipients = this.ccRecipients.concat([tagText]);
            this.inputCc = '';
        }
    }

    @action
    removeTag(fromArray, index) {
        if (fromArray === 'toRecipients') {
           const array = this.toRecipients;
           array.splice(index, 1);
           this.toRecipients = array;
        }

        if (fromArray === 'ccRecipients') {
            const array = this.ccRecipients;
            array.splice(index, 1);
            this.ccRecipients = array;
        }
    }
}

export default ComposeStore;

