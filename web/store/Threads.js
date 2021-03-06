import { action, observable, toJS } from 'mobx';
import { keyPair } from '@waves/ts-lib-crypto';
import Router from 'next/router';
import stringFromUTF8Array from '../utils/batostr';

class ThreadsStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
    this.setThread = this.setThread.bind(this);
  }

  @observable list = null;
  @observable current = null;

  @observable listDB = null;

  @action
  initLevelDB() {
    const { app } = this.stores;
    // eslint-disable-next-line global-require
    const levelup = require('levelup');
    // eslint-disable-next-line global-require
    const leveljs = require('level-js');

    this.listDB = levelup(
      leveljs(`/root/.leveldb/list_threads_${keyPair(app.seed).publicKey}`),
    );
  }

  @action
  init() {
    this.list = null;
    this.current = null;
  }

  @action
  setThread(item) {
    const { chat } = this.stores;
    this.current = item;
    chat.membersDrawerKey = null;
    chat.clearChat();
  }

  @action
  dropList() {
    const { notifiers, heartbeat } = this.stores;
    this.listDB
      .createReadStream()
      .on('data', data => {
        const k = parseInt(stringFromUTF8Array(data.key), 10);
        this.listDB.del(k);
      })
      .on('end', () => {
        this.list = [];
        heartbeat.lastTxId = null;
        notifiers.info('Cache has been cleared. Please wait...');
      });
  }

  @action
  readList() {
    const { crypto } = this.stores;
    const list = [];
    this.listDB
      .createReadStream()
      .on('data', data => {
        // const k = stringFromUTF8Array(data.key);
        // this.listDB.del(k);
        const v = stringFromUTF8Array(data.value);
        const item = JSON.parse(v);

        const listItem = crypto.decrypThread(item);
        list.push(listItem);
      })
      .on('end', () => {
        if (this.current) {
          const current = list.filter(
            el => el.threadHash === this.current.threadHash,
          )[0];
          this.current = current;
        }

        this.list = list.reverse();
      });
  }

  @action
  saveList(list) {
    const { notifiers } = this.stores;
    const records = [];
    const thisListDB = this.listDB;
    thisListDB
      .createReadStream()
      .on('data', data => {
        const k = parseInt(stringFromUTF8Array(data.key), 10);
        const v = stringFromUTF8Array(data.value);
        records.push({
          key: k,
          value: JSON.parse(v),
        });
      })
      .on('end', () => {
        const toDelete = [];
        const toSave = [];
        const newThreadHahses = list.map(el => el.threadHash);

        for (let i = 0; i < records.length; i += 1) {
          if (newThreadHahses.indexOf(records[i].value.threadHash) > -1) {
            toDelete.push({
              type: 'del',
              key: records[i].key,
            });
          }
        }

        const initKey =
          records.length > 0 ? records[records.length - 1].key + 1 : 0;
        for (let i = 0; i < list.length; i += 1) {
          toSave.push({
            type: 'put',
            key: i + initKey,
            value: JSON.stringify(list[i]),
          });
        }

        // eslint-disable-next-line consistent-return
        thisListDB.batch(toDelete, delErr => {
          if (delErr) {
            notifiers.error(delErr);
          }

          thisListDB.batch(toSave, saveErr => {
            if (saveErr) {
              notifiers.error(saveErr);
            }
            this.readList();
          });
        });
      });
  }
}

export default ThreadsStore;
