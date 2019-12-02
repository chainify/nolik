import { action, observable, toJS } from 'mobx';
import axios from 'axios';
import { keyPair } from '@waves/ts-lib-crypto';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { API_HOST, CLIENT_SEED } = publicRuntimeConfig;

class ExplorerStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
    this.importSubmit = this.importSubmit.bind(this);
    this.toggleSeedModal = this.toggleSeedModal.bind(this);
  }

  @observable cdm = null;
  @observable cdmId = null;
  @observable getCdmStatus = 'init';
  @observable showSeedModal = false;
  @observable seed = '';

  @action
  toggleSeedModal() {
    this.showSeedModal = !this.showSeedModal;
  }

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

  @action
  importSubmit() {
    const { crypto } = this.stores;
    const cdm = crypto.decryptCdm(this.cdm);
    this.cdm = cdm;
    this.toggleSeedModal();
  }
}

export default ExplorerStore;
