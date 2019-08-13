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
        this.toggleComment = this.toggleComment.bind(this);
        this.toggleAddMeber = this.toggleAddMeber.bind(this);
    }

    @observable inputTo = '';
    @observable inputCc = '';
    @observable subject = '';
    @observable message = '';
    @observable toRecipients = [];
    @observable ccRecipients = [];

    @observable composeMode = false;
    @observable composeCcOn = false;
    @observable commentIsOn = false;
    @observable addMemberOn = false;

    
    @action
    toggleCompose() {
        this.composeMode = !this.composeMode;
        if (this.composeMode === false) {
            this.resetCompose();
        }
    }

    @action
    toggleComment() {
        const { threads,  alice } = this.stores;
        this.commentIsOn = !this.commentIsOn;
        
        if (this.commentIsOn === true) {
            const subject = threads.current.cdms[threads.current.cdms.length-1].subject;
            this.subject = `Re: ${subject ? subject : ''}`;
            this.ccRecipients = threads.current.members.length > 0 ? threads.current.members : alice.publicKey;
        }
        
        this.toggleCompose();
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
        this.commentIsOn = false;
        this.composeMode = false;
        this.addMemberOn = false;
        this.inputTo = '';
        this.inputCc = '';
        this.message = '';
        this.subject = '';
        this.toRecipients = [];
        this.ccRecipients = [];
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

        if (threads.current && toArray === 'toRecipients') {
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

