import { action, observable } from 'mobx';
import { randomSeed, keyPair } from '@waves/ts-lib-crypto';

class AccountsStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
  }

  @observable list = null;
  @observable seed = null;
  @observable accountsDB = null;
  @observable hasAdminDB = null;
  @observable pwdHintsDB = null;
  @observable pwdValidDB = null;

  @action
  initLevelDB() {
    // eslint-disable-next-line global-require
    const levelup = require('levelup');
    // eslint-disable-next-line global-require
    const leveljs = require('level-js');
    this.accountsDB = levelup(leveljs(`accounts`, { prefix: 'nolik-' }));
    this.accountsDB = levelup(leveljs(`accnames`, { prefix: 'nolik-' }));
    this.accountsDB = levelup(leveljs(`hasadmin`, { prefix: 'nolik-' }));
    this.accountsDB = levelup(leveljs(`pwdhints`, { prefix: 'nolik-' }));
    this.accountsDB = levelup(leveljs(`pwdvalid`, { prefix: 'nolik-' }));
  }

  @action
  generateAccount() {
    const seed = randomSeed();
    const { publicKey } = keyPair(seed);
    const account = { publicKey, seed };
    return account;
  }

  @action
  saveAccount() {

  }
}

export default AccountsStore;
