import { action, toJS } from 'mobx';
import { sha256 } from 'js-sha256';
import {
  keyPair,
  messageEncrypt,
  messageDecrypt,
  sharedKey,
  base58Encode,
} from '@waves/ts-lib-crypto';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { CDM_VERSION, CLIENT_PREFIX, NETWORK } = publicRuntimeConfig;

class CryptoStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
    this.wrapCdm = this.wrapCdm.bind(this);
    this.decryptMessage = this.decryptMessage.bind(this);
  }

  @action
  wrapCdm(messages) {
    let cdm = '<?xml version="1.0"?>';
    cdm += '\r\n<cdm>';
    cdm += `\r\n<version>${CDM_VERSION}</version>`;
    cdm += '\r\n<blockchain>Waves</blockchain>';
    cdm += `\r\n<network>${NETWORK.substring(
      0,
      1,
    ).toUpperCase()}${NETWORK.substring(1).toLowerCase()}</network>`;
    cdm += '\r\n<messages>';
    cdm += messages;
    cdm += '\r\n</messages>';
    cdm += '\r\n</cdm>';
    return cdm;
  }

  @action
  randomize(message) {
    const { utils } = this.stores;
    if (!message) return null;
    return `${message}@${sha256(utils.generateRandom(64))}`;
  }

  @action
  encrypt(recipient, text) {
    const { app } = this.stores;
    let msg = '';
    const keys = keyPair(app.seed);
    const messageHash = sha256(text);

    const cipherBytes = messageEncrypt(
      sharedKey(keys.privateKey, recipient, CLIENT_PREFIX),
      text,
    );
    const cipherText = base58Encode(cipherBytes);

    msg += `\r\n<ciphertext>${cipherText}</ciphertext>`;
    msg += `\r\n<sha256>${messageHash}</sha256>`;

    return msg;
  }

  @action
  block(subject, message, recipient, type) {
    let msg = '';
    if (subject) {
      const sbj = this.encrypt(recipient, subject);
      msg += `\r\n<subject>`;
      msg += sbj;
      msg += `\r\n</subject>`;
    }

    const body = this.encrypt(recipient, message);
    msg += `\r\n<${type}>`;
    msg += `\r\n<publickey>${recipient}</publickey>`;
    msg += `\r\n</${type}>`;
    msg += `\r\n<body>`;
    msg += body;
    msg += `\r\n</body>`;

    return msg;
  }

  @action
  message(data) {
    let msg = '';
    const subject = data.rawSubject
      ? data.rawSubject
      : this.randomize(data.subject);
    const message = data.rawMessage
      ? data.rawMessage
      : this.randomize(data.message);
    const reSubjectHash = data.regarding ? data.regarding.reSubjectHash : null;
    const reMessageHash = data.regarding ? data.regarding.reMessageHash : null;

    const fwdSubjectHash = data.forwarded
      ? data.forwarded.fwdSubjectHash
      : null;
    const fwdMessageHash = data.forwarded
      ? data.forwarded.fwdMessageHash
      : null;

    const senderPublicKey = data.from ? data.from.senderPublicKey : null;
    const senderSignature = data.from ? data.from.senderSignature : null;

    for (let i = 0; i < data.recipients.length; i += 1) {
      const block = this.block(
        subject,
        message,
        data.recipients[i].recipient,
        data.recipients[i].type,
      );

      msg += '\r\n<message>';
      msg += block;
      if (data.regarding && (reSubjectHash || reMessageHash)) {
        msg += `\r\n<regarding>`;
        if (reSubjectHash) {
          msg += `\r\n<subjecthash>${reSubjectHash}</subjecthash>`;
        }
        if (reMessageHash) {
          msg += `\r\n<messagehash>${reMessageHash}</messagehash>`;
        }
        msg += `\r\n</regarding>>`;
      }
      if (data.forwarded && (fwdSubjectHash || fwdMessageHash)) {
        msg += `\r\n<forwarded>`;
        if (fwdSubjectHash) {
          msg += `\r\n<subjecthash>${fwdSubjectHash}</subjecthash>`;
        }
        if (fwdMessageHash) {
          msg += `\r\n<messagehash>${fwdMessageHash}</messagehash>`;
        }
        msg += `\r\n</forwarded>`;
      }
      if (data.from && senderPublicKey && data.recipients[i].signature) {
        msg += `\r\n<from>`;
        msg += `\r\n<sender>`;
        if (senderPublicKey) {
          msg += `\r\n<publickey>${senderPublicKey}</publickey>`;
        }
        if (data.recipients[i].signature) {
          msg += `\r\n<signature>${data.recipients[i].signature}</signature>`;
        }
        msg += `\r\n</sender>`;
        msg += `\r\n</from>`;
      }
      msg += '\r\n</message>';
    }
    return msg;
  }

  @action
  compose(data) {
    let msg = '';
    for (let i = 0; i < data.length; i += 1) {
      const message = this.message(data[i]);
      msg += message;
    }
    return this.wrapCdm(msg);
  }

  @action
  decryptMessage(cipherText, publicKey) {
    const { app } = this.stores;
    const keys = keyPair(app.seed);
    let decryptedMessage;
    try {
      decryptedMessage = messageDecrypt(
        sharedKey(keys.privateKey, publicKey, CLIENT_PREFIX),
        cipherText,
      );
    } catch (err) {
      decryptedMessage = '⚠️ Decoding error';
    }
    return decryptedMessage;
  }

  @action
  decryptCdm(cdm) {
    const thisCdm = cdm;

    if (cdm.subject) {
      const subject = this.decryptMessage(
        cdm.subject,
        cdm.direction === 'outgoing' ? cdm.recipient : cdm.logicalSender,
      );
      thisCdm.rawSubject = subject;
      thisCdm.subject = subject.replace(/@[\w]{64}$/gim, '');
    }

    if (cdm.message) {
      const message = this.decryptMessage(
        cdm.message,
        cdm.direction === 'outgoing' ? cdm.recipient : cdm.logicalSender,
      );
      thisCdm.rawMessage = message;
      thisCdm.message = message.replace(/@[\w]{64}$/gim, '');
    }

    return thisCdm;
  }

  @action
  decrypThread(item) {
    const cdms = [];
    const thisItem = item;

    for (let i = 0; i < item.cdms.length; i += 1) {
      const cdm = this.decryptCdm(item.cdms[i]);
      cdms.push(cdm);
    }

    thisItem.cdms = cdms.reverse();
    return thisItem;
  }
}

export default CryptoStore;
