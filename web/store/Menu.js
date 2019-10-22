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
    this.toggleImportModal = this.toggleImportModal.bind(this);
    this.togglePasswordModal = this.togglePasswordModal.bind(this);
    this.toggleDropAccountsModal = this.toggleDropAccountsModal.bind(this);
  }

  @observable backupUnlocked = false;
  @observable importProvided = false;
  @observable showShareModal = false;
  @observable showAboutModal = false;
  @observable showBackupModal = false;
  @observable passwordUnlocked = false;
  @observable dropAccountsUnlocked = false;
  @observable showPasswordModal = false;
  @observable showImportModal = false;
  @observable showDropAccountsModal = false;

  @observable importSecretPhrase = '';
  @observable dropVerification = '';

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
  toggleImportModal() {
    this.showImportModal = !this.showImportModal;
    this.importSecretPhrase = '';
    this.importProvided = false;
  }

  @action
  togglePasswordModal() {
    const { app } = this.stores;
    this.showPasswordModal = !this.showPasswordModal;
    this.passwordUnlocked = false;
    app.clearPassword();
  }

  @action
  toggleDropAccountsModal() {
    this.showDropAccountsModal = !this.showDropAccountsModal;
    this.dropAccountsUnlocked = false;
    this.dropVerification = '';
  }

  @action
  copyChatUrl() {
    const { app, notifiers, utils } = this.stores;
    const { publicKey } = keyPair(app.seed);
    const url = `${API_HOST}/pk/${publicKey}`;
    utils.clipboardTextarea(url);
    notifiers.info('Your address has been copied');
  }

  @action
  importSubmit() {
    this.importProvided = true;
  }

  @action
  importSave() {
    const { app, notifiers } = this.stores;
    app
      .verifyPassword()
      .then(res => {
        if (res === true) {
          app.saveAccount(this.importSecretPhrase);
          app.clearPassword();
          this.toggleImportModal();
        }
      })
      .catch(e => {
        notifiers.error(e);
      });
  }

  @action
  dropSubmit() {
    const { notifiers } = this.stores;
    if (this.dropVerification !== 'Drop all accounts') {
      notifiers.error('Please type "Drop all accounts"');
      return;
    }
    this.dropAccountsUnlocked = true;
  }
}

export default MenuStore;
