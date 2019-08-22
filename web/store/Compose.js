import { action, observable } from 'mobx';
import { message } from 'antd';
import { crypto } from '@waves/ts-lib-crypto';
import { toJS } from 'mobx';
const { verifyPublicKey } = crypto({output: 'Base58'});
 

class ComposeStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
        this.toggleCompose = this.toggleCompose.bind(this);
        this.toggleReplyToThread = this.toggleReplyToThread.bind(this);
        this.toggleReplyToMessage = this.toggleReplyToMessage.bind(this);
        this.toggleReplyMessageToAll = this.toggleReplyMessageToAll.bind(this);
        this.toggleAddMeber = this.toggleAddMeber.bind(this);
    }

    @observable inputTo = '';
    @observable inputCc = '';
    @observable inputFwd = '';

    @observable subject = '';
    @observable message = '';
    @observable toRecipients = [];
    @observable ccRecipients = [];
    @observable fwdRecipients = [];

    @observable composeMode = false;
    @observable composeCcOn = false;
    @observable showComposeInputs = true;
    @observable addMemberOn = false;

    @observable reSubjectHash = null;
    @observable reMessageHash = null;

    @observable fwdItem = null;
    @observable cdmType = null;

    
    @action
    toggleCompose() {
        this.composeMode = !this.composeMode;
        if (this.composeMode === false) {
            this.resetCompose();
        }
    }

    @action
    toggleReplyToThread() {
        const { threads, alice } = this.stores;
        this.toggleCompose();

        if (this.composeMode === true) {
            const initCdm = threads.current.cdms[threads.current.cdms.length-1];
            const subject = initCdm.subject;
            this.subject = `Re: ${subject ? subject : ''}`;
            this.ccRecipients = threads.current.members.length > 0 ? threads.current.members : alice.publicKey;

            this.reSubjectHash = initCdm.subjectHash;
            this.reMessageHash = initCdm.messageHash;
            this.showComposeInputs = false;

            this.cdmType = 'replyToThread';
        }
    }

    @action
    toggleReplyToMessage(item) {
        this.toggleCompose();
        if (this.composeMode === true) {
            this.subject = `Re: ${item.subject ? item.subject : ''}`;
            this.toRecipients = [item.logicalSender];
            this.showComposeInputs = false;
            this.fwdItem = item;
            this.cdmType = 'replyToMessage';
        }
    }

    @action
    toggleReplyMessageToAll(item) {
        this.toggleCompose();
        if (this.composeMode === true) {
            this.subject = `Re: ${item.subject ? item.subject : ''}`;
            this.toRecipients = [item.logicalSender];
            this.showComposeInputs = false;
            this.fwdItem = item;
            this.cdmType = 'replyMessageToAll';
        }
    }

    @action
    toggleForwardMessage(item) {
        this.toggleCompose();
        if (this.composeMode === true) {
            this.fwdItem = item;

            this.toRecipients = [];
            this.ccRecipients = [];

            this.cdmType = 'forwardMessage';
        }
    }

    @action
    toggleAddMeber() {
        const { threads } = this.stores;
        this.addMemberOn = !this.addMemberOn;
        if (this.addMemberOn === true) {
            threads.showThreadInfo = true;
        } else {
            this.resetCompose();
        }
    }

    @action
    resetCompose() {
        this.composeCcOn = false;
        this.showComposeInputs = true;
        this.composeMode = false;
        this.addMemberOn = false;
        this.inputTo = '';
        this.inputCc = '';
        this.message = '';
        this.subject = '';
        this.toRecipients = [];
        this.ccRecipients = [];
        this.newRecipients = [];
        this.reSubjectHash = null;
        this.reMessageHash = null;
        this.cdmType = null;
        this.fwdItem = null;
    }

    @action
    addTag(toArray, tagText) {
        const { alice, threads } = this.stores;
        if (tagText.trim() === '') { return }
        if (
            this.toRecipients.indexOf(tagText) > -1 ||
            this.ccRecipients.indexOf(tagText) > -1)
        {
            message.info('Recipient is already in the list');
            return;
        }

        if (threads.current && this.cdmType !== 'forwardMessage') {
            if (
                threads.current.members.indexOf(tagText) > -1 ||
                alice.publicKey === tagText
            ) {
                message.info('Recipient is already in the list');
                return;
            }
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

        if (toArray === 'fwdRecipients') {
            this.newRecipients = this.newRecipients.concat([tagText]);
            this.inputFwd = '';
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

