import { action, observable, toJS } from 'mobx';
import axios from 'axios';
import { keyPair, signBytes } from '@waves/ts-lib-crypto';
import getConfig from 'next/config';
import { sha256 } from 'js-sha256';
// import * as moment from 'moment';

const { publicRuntimeConfig } = getConfig();
const { API_HOST, CLIENT_SEED, SPONSOR_HOST } = publicRuntimeConfig;

class CdmStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
    this.toggleWithCrypto = this.toggleWithCrypto.bind(this);
    this.sendCdm = this.sendCdm.bind(this);
  }

  @observable withCrypto = [];
  @observable sendCdmStatus = 'init';
  @observable cdmData = null;

  @action
  toggleWithCrypto(txId) {
    const { withCrypto } = this;
    const index = withCrypto.indexOf(txId);
    if (index < 0) {
      withCrypto.push(txId);
    } else {
      withCrypto.splice(index, 1);
    }
    this.withCrypto = withCrypto;
  }

  // @action
  // generateTxData(attachment) {
  //   const { app } = this.stores;
  //   console.log('app.seed', app.seed);

  //   const recipient =
  //     NETWORK === 'testnet'
  //       ? address(keyPair(app.seed).publicKey, 'T')
  //       : address(keyPair(app.seed).publicKey);
  //   const txData = {
  //     type: 4,
  //     data: {
  //       amount: {
  //         assetId: ASSET_ID,
  //         tokens: '0.00000001',
  //       },
  //       fee: {
  //         assetId: ASSET_ID,
  //         tokens: '0.001',
  //       },
  //       recipient,
  //       attachment,
  //     },
  //   };
  //   return txData;
  // }

  @action
  sendCdm() {
    const { threads, notifiers, crypto, chat } = this.stores;
    this.sendCdmStatus = 'pending';

    if (threads.current) {
      this.replyToThread();
    } else {
      this.newCdm();
    }

    if (this.cdmData === null) return;
    const cdm = crypto.compose(this.cdmData);
    // console.log(cdm);
    // return;

    const ipfsFormConfig = {};
    const ipfsFormData = new FormData();
    ipfsFormData.append('data', cdm);
    axios
      .post(`${API_HOST}/api/v1/ipfs`, ipfsFormData, ipfsFormConfig)
      .then(ipfsData => {
        const keys = keyPair(CLIENT_SEED);
        const bytes = Uint8Array.from(keys.publicKey);
        const signature = signBytes(keys, bytes);

        const sponsorFormData = new FormData();
        sponsorFormData.append('signature', signature);
        sponsorFormData.append('ipfsHash', ipfsData.data.Hash);
        const formConfig = {};
        axios
          .post(`${SPONSOR_HOST}/sponsor`, sponsorFormData, formConfig)
          .then(() => {
            notifiers.success('Message has been sent. It will appear shortly.');
            if (chat.composeMode) {
              chat.toggleCompose();
            } else {
              chat.clearChat();
            }
            this.sendCdmStatus = 'success';
          })
          .catch(e => {
            console.log('err', e);
            this.sendCdmStatus = 'error';
          });
      });
  }

  @action
  newCdm() {
    const { app, chat, crypto } = this.stores;

    const rawSubject = crypto.randomize(chat.subject) || '';
    const rawMessage = crypto.randomize(chat.message) || '';

    const keys = keyPair(app.seed);
    const bytes = Uint8Array.from(
      sha256(
        `${rawSubject ? sha256(rawSubject) : ''}${
          rawMessage ? sha256(rawMessage) : ''
        }`,
      ),
    );
    const signature = signBytes(keys, bytes);

    const cdm = {
      subject: chat.subject.trim(),
      message: chat.message.trim(),
      rawSubject,
      rawMessage,
      regarding: null,
      forwarded: null,
      recipients: chat.toRecipients.map(el => ({
        recipient: el,
        type: 'to',
      })),
      from: {
        senderPublicKey: keys.publicKey,
        senderSignature: signature,
      },
    };
    this.cdmData = [cdm];
  }

  @action
  replyToThread() {
    const { threads, chat, app, crypto } = this.stores;
    const initCdm = threads.current.cdms[0];

    const rawSubject = crypto.randomize(chat.subject) || '';
    const rawMessage = crypto.randomize(chat.message) || '';

    const keys = keyPair(app.seed);
    const bytes = Uint8Array.from(
      sha256(
        `${rawSubject ? sha256(rawSubject) : ''}${
          rawMessage ? sha256(rawMessage) : ''
        }`,
      ),
    );
    const signature = signBytes(keys, bytes);

    const re = {
      subject: chat.subject.trim(),
      message: chat.message.trim(),
      rawSubject,
      rawMessage,
      regarding: {
        reSubjectHash: initCdm.subjectHash,
        reMessageHash: initCdm.messageHash,
      },
      forwarded: null,
      recipients: threads.current.members.map(el => ({
        recipient: el,
        type: 'cc',
      })),
      from: {
        senderPublicKey: keys.publicKey,
        senderSignature: signature,
      },
    };

    this.cdmData = [re];
  }
}

export default CdmStore;
