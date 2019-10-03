import { action, observable, toJS } from 'mobx';
import axios from 'axios';
import { keyPair } from '@waves/ts-lib-crypto';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;

class ExplorerStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
    this.decodeCdm = this.decodeCdm.bind(this);
  }

  @observable cdm = null;
  @observable cdmId = null;
  @observable getCdmStatus = 'init';

  @action
  getCdm() {
    this.getCdmStatus = 'fetching';
    const formConfig = {};
    axios.get(`${API_HOST}/api/v1/cdms/${this.cdmId}`, formConfig).then(res => {
      const cdm = res.data;
      cdm.rawSubject = '';
      cdm.rawMessage = '';
      this.cdm = cdm;
    });
  }

  decodeCdm() {
    const { app, crypto } = this.stores;
    const { cdm } = this;
    const alice = keyPair(app.seed).publicKey;
    const publicKey =
      alice === cdm.logicalSender ? cdm.recipient : cdm.logicalSender;

    if (cdm.subject) {
      const subject = crypto.decryptMessage(cdm.subject, publicKey);
      cdm.subject = subject.replace(/@[\w]{64}$/gim, '');
      cdm.rawSubject = subject;
    }

    if (cdm.message) {
      const message = crypto.decryptMessage(cdm.message, publicKey);
      cdm.message = message.replace(/@[\w]{64}$/gim, '');
      cdm.rawMessage = message;
    }

    this.cdm = cdm;
  }
}

export default ExplorerStore;
