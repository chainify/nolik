import { action, observable } from 'mobx';
import { randomSeed, keyPair } from '@waves/ts-lib-crypto';
import getConfig from 'next/config';
import Router from 'next/router';
import stringFromUTF8Array from '../utils/batostr';

const { publicRuntimeConfig } = getConfig();
const { CLIENT_SECRET } = publicRuntimeConfig;
const CryptoJS = require('crypto-js');

class AppStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
    this.toggleDrawer = this.toggleDrawer.bind(this);
    this.toggleWelcomeModal = this.toggleWelcomeModal.bind(this);
    this.togglePasswordModal = this.togglePasswordModal.bind(this);
    this.savePassword = this.savePassword.bind(this);
    this.logOut = this.logOut.bind(this);
    this.copySeedPhrase = this.copySeedPhrase.bind(this);
    this.copyPublicKey = this.copyPublicKey.bind(this);
    this.clearSwitch = this.clearSwitch.bind(this);
    this.switchAccount = this.switchAccount.bind(this);
    this.getPasswordHint = this.getPasswordHint.bind(this);
    this.clearWelcome = this.clearWelcome.bind(this);
    this.checkAccountExists = this.checkAccountExists.bind(this);
  }

  @observable seed = null;
  @observable accounts = null;
  @observable recipient = null;
  @observable switchTo = null;

  @observable password = '';
  @observable newPassword = '';
  @observable passwordRepeat = '';
  @observable passwordHint = '';

  @observable appDB = null;
  @observable accountsDB = null;
  @observable settingsDB = null;

  @observable showDrawer = false;
  @observable showWelcomeModal = false;
  @observable showPasswordModal = false;

  @action
  toggleDrawer() {
    this.showDrawer = !this.showDrawer;
  }

  @action
  toggleWelcomeModal() {
    this.showWelcomeModal = !this.showWelcomeModal;
  }

  @action
  togglePasswordModal() {
    this.showPasswordModal = !this.showPasswordModal;
    if (this.showPasswordModal === false) {
      this.clearPassword();
    }
  }

  @action
  clearWelcome() {
    this.showWelcomeModal = false;
    this.clearPassword();
  }

  @action
  clearPassword() {
    this.password = '';
    this.passwordRepeat = '';
    this.passwordHint = '';
    this.newPassword = '';
  }

  @action
  clearSwitch() {
    this.switchTo = null;
  }

  @action
  initAppDB() {
    // eslint-disable-next-line global-require
    const levelup = require('levelup');
    // eslint-disable-next-line global-require
    const leveljs = require('level-js');
    this.appDB = levelup(leveljs(`app`, { prefix: 'nolik-' }));
  }

  initAccountsDB() {
    // eslint-disable-next-line global-require
    const levelup = require('levelup');
    // eslint-disable-next-line global-require
    const leveljs = require('level-js');
    this.accountsDB = levelup(leveljs(`accounts`, { prefix: 'nolik-' }));
  }

  initSettingsDB() {
    // eslint-disable-next-line global-require
    const levelup = require('levelup');
    // eslint-disable-next-line global-require
    const leveljs = require('level-js');
    this.settingsDB = levelup(
      leveljs(`settings_${keyPair(this.seed).publicKey}`, {
        prefix: 'nolik-',
      }),
    );
  }

  @action
  readAccounts() {
    return new Promise(resolve => {
      const accounts = [];
      this.accountsDB
        .createReadStream()
        .on('data', data => {
          const publicKey = stringFromUTF8Array(data.key);
          const ciphertext = stringFromUTF8Array(data.value);
          // this.accountsDB.del(publicKey);
          // this.accountsDB.del('password');
          accounts.push({
            publicKey,
            ciphertext,
          });
        })
        .on('end', () => {
          this.accounts = accounts;
          resolve(accounts);
        });
    });
  }

  @action
  init() {
    const { threads, notifiers } = this.stores;

    this.readAccounts().then(accounts => {
      threads.init();
      if (accounts.length === 0) {
        this.clearWelcome();
        this.toggleWelcomeModal();
      } else {
        this.togglePasswordModal();
      }
    });

    // notifiers.sound = new Audio('/static/assets/notification.mp3');
  }

  @action
  logIn() {
    const { notifiers } = this.stores;
    this.verifyPassword()
      .then(res => {
        if (res === true) {
          const seed = this.unlockAccount(this.accounts[0].ciphertext);
          this.seed = seed;
          this.togglePasswordModal();
        }
      })
      .catch(e => {
        notifiers.error(e);
      });
  }

  @action
  logOut() {
    const { threads } = this.stores;
    this.accounts = null;
    this.seed = null;
    this.recipient = null;
    this.showDrawer = false;
    threads.list = null;
    threads.current = null;
    this.clearPassword();
    Router.push('/');
  }

  @action
  createAccount() {
    const seed = randomSeed();
    const { publicKey } = keyPair(seed);
    this.accounts = [{ publicKey, seed }];
    this.seed = seed;
  }

  @action
  savePassword() {
    const { notifiers } = this.stores;

    if (this.password === '') {
      notifiers.error(`Password can't be blank`);
      return;
    }

    if (this.password !== this.passwordRepeat) {
      notifiers.error('Passwords do not match');
      return;
    }

    const ciphertextPassord = CryptoJS.AES.encrypt(
      this.password,
      CLIENT_SECRET,
    ).toString();

    const ciphertextHint = CryptoJS.AES.encrypt(
      this.passwordHint,
      CLIENT_SECRET,
    ).toString();

    this.appDB.put('password', ciphertextPassord);
    this.appDB.put('passwordHint', ciphertextHint);
    this.createAccount();
    this.saveAccount(this.seed);
    this.clearPassword();
    this.toggleWelcomeModal();
  }

  @action
  updatePassword() {
    const { notifiers, menu } = this.stores;

    this.verifyPassword()
      .then(res => {
        if (res === true) {
          if (this.newPassword === '') {
            notifiers.error(`Password can't be blank`);
            return;
          }

          if (this.newPassword !== this.passwordRepeat) {
            notifiers.error('Passwords do not match');
            return;
          }

          for (let i = 0; i < this.accounts.length; i += 1) {
            const { ciphertext } = this.accounts[i];
            const seed = this.unlockAccount(ciphertext);

            this.updateAccount(seed);
          }

          const ciphertextPassord = CryptoJS.AES.encrypt(
            this.newPassword,
            CLIENT_SECRET,
          ).toString();

          const ciphertextHint = CryptoJS.AES.encrypt(
            this.passwordHint,
            CLIENT_SECRET,
          ).toString();

          this.appDB.put('password', ciphertextPassord);
          this.appDB.put('passwordHint', ciphertextHint);

          notifiers.success('Password has been updated');
          this.clearPassword();
          menu.togglePasswordModal();
        }
      })
      .catch(e => {
        notifiers.error(e);
      });
  }

  @action
  verifyPassword() {
    return new Promise((resolve, reject) => {
      this.appDB
        .get('password')
        .then(res => {
          const password = CryptoJS.AES.decrypt(
            stringFromUTF8Array(res),
            CLIENT_SECRET,
          ).toString(CryptoJS.enc.Utf8);

          if (this.password === '') {
            reject(new Error(`Password can't be blank`));
          }

          if (password !== this.password) {
            reject(new Error(`Provided password is not valid`));
          }

          if (password === this.password) {
            resolve(true);
          }
        })
        .catch(e => {
          if (e.direction === 'NotFoundError') {
            reject(new Error(`Password was not found`));
          } else {
            reject(e);
          }
        });
    });
  }

  @action
  saveAccount(seed) {
    const { notifiers } = this.stores;
    const { publicKey } = keyPair(seed);
    const { password } = this;

    if (password === '') {
      notifiers.error('Password is not provided');
      return;
    }

    this.checkAccountExists(publicKey)
      .then(res => {
        if (res === null) {
          const ciphertextSecret = CryptoJS.AES.encrypt(
            seed,
            CLIENT_SECRET,
          ).toString();

          const ciphertextPassword = CryptoJS.AES.encrypt(
            ciphertextSecret,
            password,
          ).toString();

          this.accountsDB.put(publicKey, ciphertextPassword);
          notifiers.success('Account has been saved');
          this.readAccounts();
        }
        if (res === true) {
          notifiers.error('Account is already in the list');
        }
      })
      .catch(e => {
        notifiers.error(e);
      });
  }

  @action
  updateAccount(seed) {
    const { publicKey } = keyPair(seed);

    const ciphertextSecret = CryptoJS.AES.encrypt(
      seed,
      CLIENT_SECRET,
    ).toString();

    const ciphertextPassword = CryptoJS.AES.encrypt(
      ciphertextSecret,
      this.newPassword,
    ).toString();

    this.accountsDB.put(publicKey, ciphertextPassword);
  }

  @action
  unlockAccount(ciphertext) {
    const { notifiers } = this.stores;
    if (this.password === '') {
      notifiers.error('Password  is not provided');
    }

    const ciphertextSecret = CryptoJS.AES.decrypt(
      ciphertext,
      this.password,
    ).toString(CryptoJS.enc.Utf8);

    const seed = CryptoJS.AES.decrypt(ciphertextSecret, CLIENT_SECRET).toString(
      CryptoJS.enc.Utf8,
    );
    return seed;
  }

  @action
  checkAccountExists(publicKey) {
    return new Promise((resolve, reject) => {
      this.accountsDB
        .get(publicKey)
        .then(() => {
          resolve(true);
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
  setAppSettings(key, value) {
    this.appDB.put(key, value);
  }

  @action
  getAppSettings(key) {
    return new Promise((resolve, reject) => {
      this.appDB
        .get(key)
        .then(res => {
          resolve(stringFromUTF8Array(res));
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
  unlockBackup() {
    const { menu, notifiers } = this.stores;
    this.verifyPassword()
      .then(res => {
        if (res === true) {
          menu.backupUnlocked = true;
          notifiers.success('Unlocked. Allowed to copy.');
        }
      })
      .catch(e => {
        notifiers.error(e);
      });
  }

  @action
  unlockPassword() {
    const { menu, notifiers } = this.stores;
    this.verifyPassword()
      .then(res => {
        if (res === true) {
          menu.passwordUnlocked = true;
          notifiers.success('Unlocked. Allowed update password.');
        }
      })
      .catch(e => {
        notifiers.error(e);
      });
  }

  @action
  copySeedPhrase() {
    const { menu, notifiers, utils } = this.stores;
    if (menu.backupUnlocked !== true) {
      notifiers.error(`Backup phrase can't be copied. Please unlock first.`);
    }

    utils.clipboardTextarea(this.seed);
    notifiers.info('Backup phrase has been copied');
    this.clearPassword();
    menu.toggleBackupModal();
  }

  @action
  copyPublicKey() {
    const { utils, notifiers } = this.stores;
    const { publicKey } = keyPair(this.seed);
    utils.clipboardTextarea(publicKey);
    notifiers.info('Public key has been copied');
  }

  @action
  switchAccount() {
    const { notifiers, threads, contacts, heartbeat } = this.stores;

    if (this.switchTo === null) {
      notifiers.error('Account is not provided');
      return;
    }

    this.verifyPassword()
      .then(res => {
        if (res === true) {
          heartbeat.lastTxId = null;
          const { ciphertext } = this.accounts.filter(
            el => el.publicKey === this.switchTo,
          )[0];
          const seed = this.unlockAccount(ciphertext);
          contacts.pinned = null;
          contacts.saved = null;
          contacts.list = null;
          this.seed = seed;
          this.clearPassword();
          this.switchTo = null;
          this.toggleDrawer();
          threads.setThread(null);
          threads.readList();
          notifiers.success('Switched account');
        }
      })
      .catch(e => {
        notifiers.error(e);
      });
  }

  @action
  getPasswordHint() {
    return new Promise((resolve, reject) => {
      this.appDB
        .get('passwordHint')
        .then(res => {
          const passwordHint = CryptoJS.AES.decrypt(
            stringFromUTF8Array(res),
            CLIENT_SECRET,
          ).toString(CryptoJS.enc.Utf8);
          resolve(passwordHint);
        })
        .catch(e => {
          if (e.direction === 'NotFoundError') {
            reject(new Error(`Password hint was not found`));
          } else {
            reject(e);
          }
        });
    });
  }

  @action
  dropAccounts() {
    const { notifiers, menu } = this.stores;
    this.verifyPassword()
      .then(res => {
        if (res === true) {
          this.accountsDB
            .createReadStream()
            .on('data', data => {
              const publicKey = stringFromUTF8Array(data.key);
              this.accountsDB.del(publicKey);
            })
            .on('end', () => {
              this.accounts = [];
              menu.toggleDropAccountsModal();
              this.logOut();
              notifiers.success('All accounts have been deleted');
            });
        }
      })
      .catch(e => {
        notifiers.error(e);
      });
  }
}

export default AppStore;
