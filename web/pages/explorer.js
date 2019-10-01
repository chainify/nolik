import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { autorun } from 'mobx';
import { observer, inject } from 'mobx-react';
import { Divider, Button } from 'antd';
import { sha256 } from 'js-sha256';
import getConfig from 'next/config';
import LogIn from './app/modals/login';
import Switch from './app/modals/switch';
const { verifySignature, keyPair } = require('@waves/ts-lib-crypto');

const { publicRuntimeConfig } = getConfig();
const { NETWORK, API_HOST } = publicRuntimeConfig;

@inject('app', 'explorer')
@observer
class Explorer extends React.Component {
  constructor(props) {
    super(props);

    const { explorer, app } = props;

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

    autorun(() => {
      if (app.seed) {
        explorer.decodeCdm();
      }
    });
  }

  componentDidMount() {
    const { app } = this.props;
    app.initAccountsDB();
    app.initAppDB();
    app.readAccounts();
  }

  render() {
    const { explorer, app } = this.props;
    let rawSubjectVerified = null;
    let rawMessageVerified = null;
    let sigVerified = null;
    if (explorer.cdm) {
      rawSubjectVerified =
        sha256(explorer.cdm.rawSubject) === explorer.cdm.subjectHash;
      rawMessageVerified =
        sha256(explorer.cdm.rawMessage) === explorer.cdm.messageHash;
      const subjectHash = explorer.cdm.subjectHash || '';
      const messageHash = explorer.cdm.messageHash || '';
      const bytes = Uint8Array.from(sha256(`${subjectHash}${messageHash}`));
      const verified = verifySignature(
        explorer.cdm.logicalSender,
        bytes,
        explorer.cdm.signature,
      );
      sigVerified = verified;
    }

    return (
      <div>
        <LogIn />
        <Switch />
        <div className="main">
          <div className="header">
            {app.seed ? (
              <Button type="link" disabled>
                {`${keyPair(app.seed).publicKey.substring(
                  0,
                  4,
                )}••••••••${keyPair(app.seed).publicKey.substring(
                  keyPair(app.seed).publicKey.length - 4,
                )}`}
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={() => {
                  app.togglePasswordModal();
                }}
                disabled={app.accounts === null || app.accounts.length === 0}
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
                <Divider />
                <p>
                  <b>Subject:</b>&nbsp;{explorer.cdm.subject}
                </p>
                <p>
                  <b>Raw subject:</b>&nbsp;{app.seed ? explorer.cdm.rawSubject : 'Please unlock'}
                </p>
                <p>
                  <b>Subject SHA256 hash:</b>&nbsp;{explorer.cdm.subjectHash}
                </p>
                <p>
                  <b>Hash is valid:</b>&nbsp;
                  {!app.seed && 'Please unlock'}
                  {app.seed && rawSubjectVerified === true && (
                    <span className="valid">TRUE</span>
                  )}
                  {app.seed && rawSubjectVerified === false && (
                    <span className="notValid">FALSE</span>
                  )}
                </p>
                <Divider />
                <p>
                  <b>Message:</b>&nbsp;{explorer.cdm.message}
                </p>
                <p>
                  <b>Raw message:</b>&nbsp;{app.seed ? explorer.cdm.rawMessage : 'Please unlock'}
                </p>
                <p>
                  <b>Message SHA256 hash:</b>&nbsp;{explorer.cdm.messageHash}
                </p>
                <p>
                  <b>Hash is valid:</b>&nbsp;
                  {!app.seed && 'Please unlock'}
                  {app.seed && rawMessageVerified === true && (
                    <span className="valid">TRUE</span>
                  )}
                  {app.seed && rawMessageVerified === false && (
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
                  <b>Signed by:</b>&nbsp;{explorer.cdm.logicalSender}
                </p>
                <p>
                  <b>Signature:</b>&nbsp;{explorer.cdm.signature}
                </p>
                <p>
                  <b>Signature is valid:</b>&nbsp;
                  {sigVerified === true && <span className="valid">TRUE</span>}
                  {sigVerified === false && (
                    <span className="notValid">FALSE</span>
                  )}
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
  app: PropTypes.object,
  explorer: PropTypes.object,
  router: PropTypes.object,
};

export default withRouter(Explorer);
