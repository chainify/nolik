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
    this.readList = this.readList.bind(this);
    this.generateName = this.generateName.bind(this);
    this.camelize = this.camelize.bind(this);
    this.toggleNewContactModal = this.toggleNewContactModal.bind(this);
    this.saveContact = this.saveContact.bind(this);
    this.saveNewContact = this.saveNewContact.bind(this);
    this.clearNewContact = this.clearNewContact.bind(this);
    this.toggleContactInfo = this.toggleContactInfo.bind(this);
  }

  @observable list = null;
  @observable contactsDB = null;

  @observable showNewContactModal = false;
  @observable newPublicKey = '';
  @observable newContactName = '';
  @observable contactPublicKey = null;

  @action
  initLevelDB() {
    const { app } = this.stores;
    // eslint-disable-next-line global-require
    const levelup = require('levelup');
    // eslint-disable-next-line global-require
    const leveljs = require('level-js');

    this.contactsDB = levelup(
      leveljs(`/root/.leveldb/contacts_book_${keyPair(app.seed).publicKey}`),
    );
  }

  @action
  toggleNewContactModal() {
    this.showNewContactModal = !this.showNewContactModal;
    this.clearNewContact();
  }

  @action
  toggleContactInfo(publicKey) {
    this.contactPublicKey = publicKey;
  }

  @action
  clearNewContact() {
    this.newContactName = '';
    this.newPublicKey = '';
  }

  @action
  readList() {
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
          this.list = list.reverse();
        });
      });
  }

  @action
  saveContact(publicKey, contact) {
    return new Promise((resolve, reject) => {
      const isValidPublicKey = verifyPublicKey(publicKey);
      if (!isValidPublicKey) {
        reject(new Error('Public key is not valid'));
        return;
      }

      const ciphertext = CryptoJS.AES.encrypt(
        contact,
        CLIENT_SECRET,
      ).toString();
      this.contactsDB.put(publicKey, ciphertext, () => {
        this.readList();
        resolve('Contact saved');
      });
    });
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

    this.saveContact(this.newPublicKey, this.newContactName)
      .then(res => {
        notifiers.success(res);
        this.readList();
        this.toggleNewContactModal();
      })
      .catch(e => {
        notifiers.error(e);
      });
  }

  @action
  generateName() {
    const name = uniqueNamesGenerator({
      length: 2,
      separator: ' ',
    });
    // const camelized = this.camelize(name);
    // return camelized;
    return 'Unknown sender';
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
  decryptContact(ciphertext) {
    const contact = CryptoJS.AES.decrypt(
      stringFromUTF8Array(ciphertext),
      CLIENT_SECRET,
    ).toString(CryptoJS.enc.Utf8);
    return contact;
  }

  // @action
  // pinBaseContacts() {
  //   this.pinContact(
  //     'Ft5eAxcCmzfQnv1CznLqR9MZ2Vt7ewfD8caHzpcLM23x',
  //     'Founder of Nolik',
  //   );
  // }
}

export default ExplorerStore;
