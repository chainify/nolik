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
    this.copySeedPhrase = this.copySeedPhrase.bind(this);
    this.toggleShareModal = this.toggleShareModal.bind(this);
  }

  @observable showShareModal = false;

  @action
  toggleShareModal() {
    this.showShareModal = !this.showShareModal;
  }

  @action
  copyChatUrl() {
    const { app, notifiers, utils } = this.stores;
    const { publicKey } = keyPair(app.seed);
    const url = `${API_HOST}/pk/${publicKey}`;
    utils.clipboardTextarea(url);
    notifiers.info('Chat URL has been copied');
  }

  @action
  copySeedPhrase() {
    const { app, notifiers, utils } = this.stores;
    utils.clipboardTextarea(app.seed);
    notifiers.info('Seed Phrase has been copied');
  }
}

export default MenuStore;
