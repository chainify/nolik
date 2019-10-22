import { action, observable } from 'mobx';
import Router from 'next/router';
import { verifyPublicKey } from '@waves/ts-lib-crypto';

class ChatStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
    this.toggleCompose = this.toggleCompose.bind(this);
    this.toggleContacts = this.toggleContacts.bind(this);
    this.toggleShowMembers = this.toggleShowMembers.bind(this);
    this.toggleAddMemberMode = this.toggleAddMemberMode.bind(this);
    this.toggleNewMember = this.toggleNewMember.bind(this);
    this.dropCompose = this.dropCompose.bind(this);
    this.writeToNolik = this.writeToNolik.bind(this);
    this.clearNewMembers = this.clearNewMembers.bind(this);
  }

  @observable subject = '';
  @observable message = '';
  @observable defaultSubjectPlaceholder = '';
  @observable defaultMessagePlaceholder = 'Write your message';
  @observable subjectPlaceholder = this.defaultSubjectPlaceholder;
  @observable messagePlaceholder = this.defaultMessagePlaceholder;
  @observable toRecipients = [];
  @observable ccRecipients = [];
  @observable composeMode = false;
  @observable focusMode = false;
  @observable contactsMode = false;
  @observable membersDrawerKey = null;
  @observable addMemberMode = false;
  @observable onlineMembers = null;

  @observable inputTo = '';
  @observable inputCc = '';

  @observable newMembers = [];
  @observable membersSearch = '';

  @action
  toggleCompose() {
    this.composeMode = !this.composeMode;
    if (this.composeMode === false) {
      this.dropCompose();
    }
  }

  @action
  toggleFocus() {
    this.focusMode = !this.focusMode;
  }

  @action
  toggleContacts() {
    const { app } = this.stores;
    this.contactsMode = !this.contactsMode;
    app.showDrawer = false;
  }

  @action
  toggleShowMembers(chatMembersKey) {
    this.membersDrawerKey = chatMembersKey;
  }

  @action
  toggleAddMemberMode() {
    this.addMemberMode = !this.addMemberMode;
  }

  @action
  toggleNewMember(publicKey) {
    const index = this.newMembers.indexOf(publicKey);
    const { newMembers } = this;
    if (index < 0) {
      this.newMembers = newMembers.concat([publicKey]);
    } else {
      newMembers.splice(index, 1);
    }
  }

  @action
  clearNewMembers() {
    this.membersDrawerKey = null;
    this.newMembers = [];
    this.membersSearch = '';
  }

  @action
  compose(toRecipients) {
    this.toggleCompose();
    this.toRecipients = toRecipients;
  }

  @action
  dropCompose() {
    this.clearChat();
    Router.push('/app');
  }

  @action
  clearChat() {
    this.toRecipients = [];
    this.ccRecipients = [];
    this.subject = '';
    this.message = '';
    this.subjectPlaceholder = this.defaultSubjectPlaceholder;
    this.messagePlaceholder = this.defaultMessagePlaceholder;
  }

  @action
  writeToNolik() {
    const { app } = this.stores;
    // const publicKey = 'cEdRrkTRMkd61UdQHvs1c2pwLfuCXVTA4GaABmiEqrP';
    const publicKey = 'Ft5eAxcCmzfQnv1CznLqR9MZ2Vt7ewfD8caHzpcLM23x';
    this.toRecipients = [publicKey];
    this.composeMode = true;
    app.toggleDrawer();
    Router.push('/app', `/pk/${publicKey}`);
  }

  @action
  addTag(toArray, tagText) {
    const { notifiers } = this.stores;
    if (tagText.trim() === '') {
      return;
    }

    if (
      this.toRecipients.indexOf(tagText) > -1 ||
      this.ccRecipients.indexOf(tagText) > -1
    ) {
      notifiers.info('Recipient is already in the list');
      return;
    }

    let isValidPublicKey = false;
    try {
      isValidPublicKey = verifyPublicKey(tagText);
    } catch (e) {
      notifiers.error(e.message ? e.message : e);
    }

    if (!isValidPublicKey) {
      notifiers.info('Public Key is not valid');
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

export default ChatStore;
