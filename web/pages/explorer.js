import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { autorun, toJS } from 'mobx';
import { observer, inject } from 'mobx-react';
import { Divider, Button } from 'antd';
import { sha256 } from 'js-sha256';
import * as moment from 'moment';
import getConfig from 'next/config';
import UnlockSeed from './app/modals/unlockSeed';
const { verifySignature, keyPair } = require('@waves/ts-lib-crypto');

const { publicRuntimeConfig } = getConfig();
const { NETWORK, API_HOST, CLIENT_SEED } = publicRuntimeConfig;

@inject('explorer', 'crypto')
@observer
class Explorer extends React.Component {
  constructor(props) {
    super(props);

    const { explorer } = props;

    autorun(() => {
      if (props.router.query.cdmId) {
        explorer.cdmId = props.router.query.cdmId;
      }
    });

    autorun(() => {
      if (explorer.cdmId) {
        explorer.getCdm();
      }
    });
  }

  render() {
    const { explorer, crypto } = this.props;
    let rawSubjectVerified = null;
    let rawMessageVerified = null;
    let sigVerified = null;
    let signedText = '';

    if (explorer.cdm) {
      if (explorer.cdm.rawSubject) {
        rawSubjectVerified =
          sha256(explorer.cdm.rawSubject) === explorer.cdm.subjectHash;
      }
      if (explorer.cdm.rawMessage) {
        rawMessageVerified =
          sha256(explorer.cdm.rawMessage) === explorer.cdm.messageHash;
      }
      const logicalSender = crypto.decryptPublicKey(
        explorer.cdm.logicalSender,
        keyPair(CLIENT_SEED).publicKey,
      );

      const subjectHash = explorer.cdm.subjectHash || '';
      const messageHash = explorer.cdm.messageHash || '';
      signedText = sha256(`${subjectHash}${messageHash}`);
      const bytes = Uint8Array.from(signedText);
      const verified = verifySignature(
        logicalSender,
        bytes,
        explorer.cdm.signature,
      );
      sigVerified = verified;
    }

    return (
      <div>
        <UnlockSeed />
        <div className="main">
          <div className="header">
            {explorer.seed ? (
              <Button type="link" disabled>
                {`${keyPair(explorer.seed).publicKey.substring(
                  0,
                  4,
                )}••••••••${keyPair(explorer.seed).publicKey.substring(
                  keyPair(explorer.seed).publicKey.length - 4,
                )}`}
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={() => {
                  explorer.toggleSeedModal();
                }}
                // disabled={app.accounts === null || app.accounts.length === 0}
              >
                Unlock
              </Button>
            )}
          </div>
          <div className="container">
            {explorer.cdm === null && 'Loading...'}
            {explorer.cdm && (
              <div>
                <p>
                  <b>Blockchain transaction ID:</b>
                  <a
                    href={`https://wavesexplorer.com/${
                      NETWORK === 'testnet' ? 'testnet/' : ''
                    }tx/${explorer.cdm.txId}`}
                    target="_blank"
                  >
                    &nbsp;{explorer.cdm.txId}
                  </a>
                </p>
                <p>
                  <b>IPFS Hash:</b>
                  <a
                    href={`${API_HOST}/ipfs/${explorer.cdm.ipfsHash}`}
                    target="_blank"
                  >
                    &nbsp;{explorer.cdm.ipfsHash}
                  </a>
                </p>
                <p>
                  <b>Timestamp:</b>&nbsp;
                  {moment(explorer.cdm.timestamp * 1000).format('LLLL')}&nbsp;[
                  {moment(explorer.cdm.timestamp * 1000).fromNow()}]
                </p>
                <Divider />
                <p>
                  <b>Sender:</b>&nbsp;{explorer.cdm.logicalSender || explorer.cdm.realSender}
                </p>
                <p>
                  <b>Recipient:</b>&nbsp;{explorer.cdm.recipient}
                </p>
                {/* <p>
                  <b>Shared with:</b>&nbsp;{explorer.cdm.sharedWith.map(el => el.publicKey).join(', ')}
                </p> */}
                <Divider />
                <p>
                  <b>Subject:</b>&nbsp;{explorer.cdm.subject || '-'}
                </p>
                <p>
                  <b>Raw subject:</b>&nbsp;{explorer.seed ? explorer.cdm.rawSubject || '-' : 'Please unlock'}
                </p>
                <p>
                  <b>Subject SHA256 hash:</b>&nbsp;{explorer.cdm.subjectHash || '-'}
                </p>
                <p>
                  <b>Hash is valid:</b>&nbsp;
                  {!explorer.seed && 'Please unlock'}
                  {explorer.seed && rawSubjectVerified === null && <span>-</span>}
                  {explorer.seed && rawSubjectVerified === true && (
                    <span className="valid">TRUE</span>
                  )}
                  {explorer.seed && rawSubjectVerified === false && (
                    <span className="notValid">FALSE</span>
                  )}
                </p>
                <Divider />
                <p>
                  <b>Message:</b>&nbsp;{explorer.cdm.message || '-'}
                </p>
                <p>
                  <b>Raw message:</b>&nbsp;{explorer.seed ? explorer.cdm.rawMessage || '-' : 'Please unlock'}
                </p>
                <p>
                  <b>Message SHA256 hash:</b>&nbsp;{explorer.cdm.messageHash || '-'}
                </p>
                <p>
                  <b>Hash is valid:</b>&nbsp;
                  {!explorer.seed && 'Please unlock'}
                  {explorer.seed && rawMessageVerified === null && <span>-</span>}
                  {explorer.seed && rawMessageVerified === true && (
                    <span className="valid">TRUE</span>
                  )}
                  {explorer.seed && rawMessageVerified === false && (
                    <span className="notValid">FALSE</span>
                  )}
                </p>
                <Divider />
                <p>
                  <b>CDM type:</b>&nbsp;
                  {explorer.cdm.logicalSender === explorer.cdm.realSender
                    ? 'Direct (Blockchain proof)'
                    : 'Sponsored (CDM proof)'}
                </p>
                <p>
                  <b>Signed by:</b>&nbsp;
                  {explorer.cdm.logicalSender === explorer.cdm.realSender
                    ? explorer.cdm.realSender
                    : 'Sponsored (CDM proof)'}
                </p>
                <p>
                  <b>Signed text:</b>&nbsp;
                  {explorer.cdm.logicalSender === explorer.cdm.realSender
                    ? 'Blockchain proof'
                    : signedText}
                </p>
                <p>
                  <b>Signature:</b>
                  &nbsp;
                  {explorer.cdm.logicalSender === explorer.cdm.realSender
                    ? 'Blockchain signature'
                    : explorer.cdm.signature}
                </p>
                <p>
                  {explorer.cdm.logicalSender !== explorer.cdm.realSender && (
                    <b>Signature is valid:</b>
                  )}
                  &nbsp;
                  {explorer.cdm.logicalSender !== explorer.cdm.realSender &&
                    sigVerified === true && <span className="valid">TRUE</span>}
                  {explorer.cdm.logicalSender !== explorer.cdm.realSender &&
                    sigVerified === false && <span className="notValid">FALSE</span>}
                </p>
              </div>
            )}
          </div>
        </div>
        <style jsx>{`
          .main {
            height: 100vh;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
          }

          .header {
            padding: 2em;
            text-align: right;
          }

          .container {
            padding: 2em 2em 4em 2em;
          }

          span.valid {
            background: #43a047;
            color: #fff;
            padding: 0em 0.4em;
          }

          span.notValid {
            background: #ef5350;
            color: #fff;
            padding: 0em 0.4em;
          }

          p {
            word-break: break-all;
          }
        `}</style>
      </div>
    );
  }
}

Explorer.propTypes = {
  explorer: PropTypes.object,
  crypto: PropTypes.object,
  router: PropTypes.object,
};

export default withRouter(Explorer);
