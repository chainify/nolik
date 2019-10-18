import { action, observable, toJS } from 'mobx';
import axios from 'axios';
import { keyPair } from '@waves/ts-lib-crypto';
import getConfig from 'next/config';
import stringFromUTF8Array from '../utils/batostr';
import { verifyPublicKey } from '@waves/ts-lib-crypto';

const CryptoJS = require('crypto-js');

const { publicRuntimeConfig } = getConfig();
const { CLIENT_SECRET } = publicRuntimeConfig;
const { uniqueNamesGenerator } = require('unique-names-generator');

class ExplorerStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
    this.readSaved = this.readSaved.bind(this);
    this.generateName = this.generateName.bind(this);
    this.camelize = this.camelize.bind(this);
    this.toggleNewContactModal = this.toggleNewContactModal.bind(this);
    this.saveContact = this.saveContact.bind(this);
    this.saveNewContact = this.saveNewContact.bind(this);
    this.clearNewContact = this.clearNewContact.bind(this);
  }

  @observable list = null;
  @observable pinned = null;
  @observable saved = null;
  @observable contactsDB = null;
  @observable pinnedDB = null;

  @observable showNewContactModal = false;
  @observable newPublicKey = '';
  @observable newContactName = '';

  @action
  initLevelDB() {
    const { app } = this.stores;
    // eslint-disable-next-line global-require
    const levelup = require('levelup');
    // eslint-disable-next-line global-require
    const leveljs = require('level-js');

    this.contactsDB = levelup(
      leveljs(`/root/.leveldb/contacts_${keyPair(app.seed).publicKey}`),
    );
    this.pinnedDB = levelup(
      leveljs(`/root/.leveldb/pinned_${keyPair(app.seed).publicKey}`),
    );
  }

  @action
  toggleNewContactModal() {
    this.showNewContactModal = !this.showNewContactModal;
    this.clearNewContact();
  }

  @action
  clearNewContact() {
    this.newContactName = '';
    this.newPublicKey = '';
  }

  @action
  readPinned() {
    const promises = [];
    this.pinnedDB
      .createReadStream()
      .on('data', data => {
        const k = stringFromUTF8Array(data.key);
        const p = this.getPinned(k).then(res => ({
          publicKey: k,
          contact: res,
        }));
        promises.push(p);
      })
      .on('end', () => {
        Promise.all(promises).then(list => {
          this.pinned = list.reverse();
        });
      });
  }

  @action
  readSaved() {
    const promises = [];
    this.contactsDB
      .createReadStream()
      .on('data', data => {
        const k = stringFromUTF8Array(data.key);
        const p = this.getContact(k).then(res => ({
          publicKey: k,
          contact: res,
        }));
        promises.push(p);
      })
      .on('end', () => {
        Promise.all(promises).then(list => {
          this.saved = list.reverse();
        });
      });
  }

  @action
  createList() {
    this.list = this.pinned.concat(this.saved);
  }

  @action
  saveContact(publicKey, contact) {
    const { notifiers } = this.stores;
    const isValidPublicKey = verifyPublicKey(publicKey);
    if (!isValidPublicKey) {
      notifiers.error('Public key is not valid');
      return false;
    }

    const ciphertext = CryptoJS.AES.encrypt(contact, CLIENT_SECRET).toString();
    this.pinnedDB.del(publicKey);
    this.contactsDB.put(publicKey, ciphertext);
    this.readSaved();
    this.readPinned();
    this.createList();
  }

  @action
  pinContact(publicKey, contact) {
    const { notifiers } = this.stores;
    const isValidPublicKey = verifyPublicKey(publicKey);
    if (!isValidPublicKey) {
      notifiers.error('Public key is not valid');
      return false;
    }

    const ciphertext = CryptoJS.AES.encrypt(contact, CLIENT_SECRET).toString();
    this.contactsDB.del(publicKey);
    this.pinnedDB.put(publicKey, ciphertext);
    this.readSaved();
    this.readPinned();
    this.createList();
  }

  @action
  saveNewContact() {
    const { notifiers } = this.stores;

    if (this.newPublicKey === '' || this.newContactName === '') {
      notifiers.error('Public key and contact name must not be empty');
      return false;
    }

    if (this.list.filter(el => el.publicKey === this.newPublicKey).length > 0) {
      notifiers.error('Public key is already in contacts list');
      return false;
    }

    this.pinContact(this.newPublicKey, this.newContactName);
    this.toggleNewContactModal();
    this.readSaved();
    this.readPinned();
    notifiers.success('Contact saved');
  }

  @action
  generateName() {
    const name = uniqueNamesGenerator({
      length: 2,
      separator: ' ',
    });
    const camelized = this.camelize(name);
    return camelized;
  }

  @action
  camelize(str) {
    const arr = str
      .split(' ')
      .map(
        el =>
          `${el.substring(0, 1).toUpperCase()}${el.substring(1).toLowerCase()}`,
      );
    const camelized = arr.join(' ');
    return camelized;
  }

  @action
  getContact(publicKey) {
    return new Promise((resolve, reject) => {
      this.contactsDB
        .get(publicKey)
        .then(ciphertext => {
          const contact = this.decryptContact(ciphertext);
          resolve(contact);
        })
        .catch(e => {
          if (e.name === 'NotFoundError') {
            resolve(null);
          } else {
            reject(e);
          }
        });
    });
  }

  @action
  getPinned(publicKey) {
    return new Promise((resolve, reject) => {
      this.pinnedDB
        .get(publicKey)
        .then(ciphertext => {
          const contact = this.decryptContact(ciphertext);
          resolve(contact);
        })
        .catch(e => {
          if (e.name === 'NotFoundError') {
            resolve(null);
          } else {
            reject(e);
          }
        });
    });
  }

  @action
  decryptContact(ciphertext) {
    const contact = CryptoJS.AES.decrypt(
      stringFromUTF8Array(ciphertext),
      CLIENT_SECRET,
    ).toString(CryptoJS.enc.Utf8);
    return contact;
  }

  @action
  pinBaseContacts() {
    this.pinContact(
      'Ft5eAxcCmzfQnv1CznLqR9MZ2Vt7ewfD8caHzpcLM23x',
      'Founder of Nolik',
    );
  }
}

export default ExplorerStore;
