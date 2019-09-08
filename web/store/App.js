import { action, observable } from 'mobx';
import { randomSeed, keyPair } from '@waves/ts-lib-crypto';
import getConfig from 'next/config';
import stringFromUTF8Array from '../utils/batostr';

const { publicRuntimeConfig } = getConfig();
const { CLIENT_SECRET } = publicRuntimeConfig;
const CryptoJS = require('crypto-js');

class AppStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
  }

  @observable seed = null;
  @observable accounts = null;

  @observable appDB = null;
  @observable accountsDB = null;

  @action
  initLevelDB() {
    // eslint-disable-next-line global-require
    const levelup = require('levelup');
    // eslint-disable-next-line global-require
    const leveljs = require('level-js');
    this.appDB = levelup(leveljs(`/root/.leveldb/app`));
    this.accountsDB = levelup(leveljs(`/root/.leveldb/accounts`));
  }

  @action
  init() {
    const { notifiers } = this.stores;

    const accounts = [];
    this.accountsDB
      .createReadStream()
      .on('data', data => {
        const publicKey = stringFromUTF8Array(data.key);
        const ciphertext = stringFromUTF8Array(data.value);
        accounts.push({
          publicKey,
          ciphertext,
        });
      })
      .on('end', () => {
        if (accounts.length === 0) {
          this.createAccount();
          this.saveAccount();
        } else {
          this.seed = this.unlockAccount(accounts[0].ciphertext);
          this.accounts = accounts;
        }
        // this.accounts = accounts.length > 0 ? accounts :
        console.log('accounts', accounts);
      });

    // this.appDB
    //   .get('seed')
    //   .then(bytes => {
    //     const ciphertext = stringFromUTF8Array(bytes);
    //     this.seed = seed;
    //     this.publicKey = keyPair(seed).publicKey;
    //   })
    //   .catch(e => {
    //     if (e.name === 'NotFoundError') {
    //     } else {
    //       notifiers.error(`AppDB Error: ${e}`);
    //     }
    //   });
  }

  @action
  createAccount() {
    const seed = randomSeed();
    const { publicKey } = keyPair(seed);
    this.accounts = [{ publicKey, seed }];
    this.seed = seed;
  }

  @action
  saveAccount() {
    const { publicKey } = keyPair(this.seed);
    const ciphertext = CryptoJS.AES.encrypt(
      this.seed,
      CLIENT_SECRET,
    ).toString();
    this.accountsDB.put(publicKey, ciphertext);
  }

  @action
  unlockAccount(ciphertext) {
    const seed = CryptoJS.AES.decrypt(ciphertext, CLIENT_SECRET).toString(
      CryptoJS.enc.Utf8,
    );
    return seed;
  }
}

export default AppStore;
