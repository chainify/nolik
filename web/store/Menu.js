import { action, observable } from 'mobx';
import { keyPair } from '@waves/ts-lib-crypto';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;

class MenuStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
    this.copyChatUrl = this.copyChatUrl.bind(this);
    this.toggleShareModal = this.toggleShareModal.bind(this);
    this.toggleAboutModal = this.toggleAboutModal.bind(this);
    this.toggleBackupModal = this.toggleBackupModal.bind(this);
    this.togglePasswordModal = this.togglePasswordModal.bind(this);
  }

  @observable backupUnlocked = false;
  @observable showShareModal = false;
  @observable showAboutModal = false;
  @observable showBackupModal = false;
  @observable passwordUnlocked = false;
  @observable showPasswordModal = false;

  @action
  toggleShareModal() {
    this.showShareModal = !this.showShareModal;
  }

  @action
  toggleAboutModal() {
    this.showAboutModal = !this.showAboutModal;
  }

  @action
  toggleBackupModal() {
    this.backupUnlocked = false;
    this.showBackupModal = !this.showBackupModal;
  }

  @action
  togglePasswordModal() {
    this.showPasswordModal = !this.showPasswordModal;
  }

  @action
  copyChatUrl() {
    const { app, notifiers, utils } = this.stores;
    const { publicKey } = keyPair(app.seed);
    const url = `${API_HOST}/pk/${publicKey}`;
    utils.clipboardTextarea(url);
    notifiers.info('Your address has been copied');
  }
}

export default MenuStore;
