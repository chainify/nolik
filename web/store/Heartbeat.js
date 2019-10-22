import { action, observable, toJS } from 'mobx';
import axios from 'axios';
import { keyPair } from '@waves/ts-lib-crypto';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;

class HeartbeatStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
    this.push = this.push.bind(this);
  }

  @observable heartbeatStatus = 'init';
  @observable lastTxId = null;

  @action
  dropList(key, value) {
    const { app, threads } = this.stores;
    app.getAppSettings(key).then(currentVersion => {
      if (currentVersion !== value) {
        if (currentVersion !== null) {
          threads.dropList();
          this.lastTxId = null;
        }
        app.setAppSettings(key, value);
      }
    });
  }

  @action
  push() {
    const { utils, threads, app, chat } = this.stores;
    const formConfig = {};

    if (threads.list && threads.list.length > 0 && this.lastTxId === null) {
      this.lastTxId = threads.list[0].cdms[0].txId;
    }

    const formData = new FormData();
    formData.append('publicKey', keyPair(app.seed).publicKey);
    if (this.lastTxId) {
      formData.append('lastTxId', this.lastTxId);
    }
    if (threads.current) {
      formData.append('threadMembers', threads.current.members.join(','));
    }
    this.heartbeatStatus = 'pending';
    utils.sleep(this.heartbeatStatus === 'init' ? 0 : 1000).then(() => {
      axios
        .post(`${API_HOST}/api/v1/heartbeat`, formData, formConfig)
        .then(res => {
          const listThreads = res.data.threads;

          this.dropList('cdmVersion', res.data.cdmVersion);
          this.dropList('apiVersion', res.data.apiVersion);

          chat.onlineMembers = res.data.onlineMembers;

          if (listThreads.length > 0) {
            const lastThreadCdms = listThreads[listThreads.length - 1].cdms;
            const lastTxId = lastThreadCdms[0].txId;

            if (this.lastTxId !== lastTxId) {
              threads.saveList(listThreads);
              this.lastTxId = lastTxId;
            }
          }
        })
        .then(() => {
          this.heartbeatStatus = 'success';
        })
        .catch(() => {
          this.heartbeatStatus = 'error';
        });
    });
  }
}

export default HeartbeatStore;
