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
    this.sendNewCdm = this.sendNewCdm.bind(this);
    this.sendThreadCdm = this.sendThreadCdm.bind(this);
    this.sendAddMembersCdm = this.sendAddMembersCdm.bind(this);
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

  @action
  sendNewCdm() {
    this.newCdm();
    this.sendCdm();
  }

  @action
  sendThreadCdm() {
    const { threads, notifiers } = this.stores;

    if (!threads.current) {
      notifiers.error('Thread is not selected');
      return;
    }

    this.replyToThread();
    this.sendCdm();
  }

  @action
  sendAddMembersCdm() {
    const { threads, notifiers } = this.stores;

    if (!threads.current) {
      notifiers.error('Thread is not selected');
      return;
    }

    this.addMembers();
    this.sendCdm();
  }

  @action
  sendCdm() {
    const { notifiers, crypto, chat } = this.stores;
    if (this.sendCdmStatus === 'pending') {
      notifiers.warning('Senging in progress. Please wait...');
      return;
    }

    if (this.cdmData === null) return;

    if (chat.composeMode === true) {
      if (chat.toRecipients.concat(chat.ccRecipients).length === 0) {
        notifiers.error(`There must be at least one recipient`);
        return;
      }

      if (chat.subject.trim() === '') {
        notifiers.error(`Subject can't be empty`);
        return;
      }

      if (chat.message.trim() === '') {
        notifiers.error(`Message can't be empty`);
        return;
      }
    }

    this.sendCdmStatus = 'pending';
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
            chat.clearNewMembers();
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
        signature: signBytes(keys, bytes),
      })),
      from: {
        senderPublicKey: keys.publicKey,
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
        signature: signBytes(keys, bytes),
      })),
      from: {
        senderPublicKey: keys.publicKey,
      },
    };

    this.cdmData = [re];
  }

  @action
  addMembers() {
    const { threads, chat, app, crypto } = this.stores;
    const data = [];
    const keys = keyPair(app.seed);

    const initCdm = threads.current.cdms[0];
    const fwdInitRawSubject = crypto.randomize(initCdm.subject);
    const fwdInitRawMessage = crypto.randomize(initCdm.message);


    // const message = `Added new ${
    //   chat.newMembers.length > 1 ? 'members' : 'member'
    // }: ${chat.newMembers.join(', ')}`;
    const message = `Added new ${
      chat.newMembers.length > 1 ? 'members' : 'member'
    }}`;
    const rawMessage = crypto.randomize(message) || '';

    const bytes = Uint8Array.from(
      sha256(`${rawMessage ? sha256(rawMessage) : ''}`),
    );

    const cdm = {
      subject: '',
      message,
      rawSubject: '',
      rawMessage,
      regarding: {
        reSubjectHash: sha256(fwdInitRawSubject),
        reMessageHash: sha256(fwdInitRawMessage),
      },
      forwarded: null,
      recipients: threads.current.members
        .map(el => ({
          recipient: el,
          type: 'to',
          signature: signBytes(keys, bytes),
        }))
        .concat(
          chat.newMembers.map(el => ({
            recipient: el,
            type: 'to',
            signature: signBytes(keys, bytes),
          })),
        ),
      from: {
        senderPublicKey: keys.publicKey,
      },
    };
    data.push(cdm);

    for (let i = 0; i < threads.current.cdms.length; i += 1) {
      const fwdCdm = threads.current.cdms[i];
      const fwdBytes = Uint8Array.from(
        sha256(
          `${fwdCdm.rawSubject ? sha256(fwdCdm.rawSubject) : ''}${
            fwdCdm.rawMessage ? sha256(fwdCdm.rawMessage) : ''
          }`,
        ),
      );

      const fwd = {
        subject: fwdCdm.subject,
        message: fwdCdm.message,
        rawSubject: fwdCdm.id === initCdm.id ? fwdInitRawSubject : null,
        rawMessage: fwdCdm.id === initCdm.id ? fwdInitRawMessage : null,
        regarding: {
          reSubjectHash:
            fwdCdm.id === initCdm.id ? null : sha256(fwdInitRawSubject),
          reMessageHash:
            fwdCdm.id === initCdm.id ? null : sha256(fwdInitRawMessage),
        },
        forwarded: {
          fwdSubjectHash: fwdCdm.subjectHash,
          fwdMessageHash: fwdCdm.messageHash,
        },
        recipients: threads.current.members
          .map(el => ({
            recipient: el,
            type: 'to',
            signature: signBytes(keys, fwdBytes),
          }))
          .concat(
            chat.newMembers.map(el => ({
              recipient: el,
              type: 'to',
              signature: signBytes(keys, fwdBytes),
            })),
          ),
        from: {
          senderPublicKey: keys.publicKey,
        },
      };
      data.push(fwd);
    }

    this.cdmData = data;
  }
}

export default CdmStore;
