import { action, observable } from 'mobx';
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
        const v = stringFromUTF8Array(data.value);

        const item = JSON.parse(v);
        const listItem = crypto.decrypThread(item);
        list.push(listItem);
      })
      .on('end', () => {
        this.list = list.reverse();
      });
  }

  @action
  updateList(list) {
    const { crypto } = this.stores;
    const hashes = this.list ? this.list.map(el => el.threadHash) : [];
    const indexesToDelete = [];

    const decLIst = [];
    let current = null;
    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      const index = hashes.indexOf(item.threadHash);

      if (index > -1) {
        indexesToDelete.push(index);
      }

      if (this.current && this.current.threadHash === item.threadHash) {
        current = item;
      }

      decLIst.push(crypto.decrypThread(item));
    }

    const sorted = indexesToDelete.sort((a, b) => b - a);
    if (this.list) {
      for (let i = 0; i < sorted.length; i += 1) {
        this.list.splice(sorted[i], 1);
      }
      const newList = decLIst.reverse().concat(this.list);
      this.list = newList;
    }

    if (current) {
      this.current = current;
      // this.setThread(current);
    }
  }

  @action
  saveList(list) {
    const records = [];
    this.listDB
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
        const operations = [];
        const newThreadHahses = list.map(el => el.threadHash);

        for (let i = 0; i < records.length; i += 1) {
          if (newThreadHahses.indexOf(records[i].value.threadHash) > -1) {
            operations.push({
              type: 'del',
              key: records[i].key,
            });
          }
        }

        const initKey =
          records.length > 0 ? records[records.length - 1].key + 1 : 0;
        for (let i = 0; i < list.length; i += 1) {
          operations.push({
            type: 'put',
            key: i + initKey,
            value: JSON.stringify(list[i]),
          });
        }

        // eslint-disable-next-line consistent-return
        this.listDB.batch(operations, err => {
          if (err) return console.log('Ooops!', err);
          this.updateList(list);
        });
      });
  }
}

export default ThreadsStore;
