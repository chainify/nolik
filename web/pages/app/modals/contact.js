import React from 'react';
import PropTypes from 'prop-types';
import { keyPair } from '@waves/ts-lib-crypto';
import { observer, inject } from 'mobx-react';
import { Modal, Icon, Divider, Typography } from 'antd';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;
const { Paragraph } = Typography;

@inject('contacts', 'threads', 'notifiers')
@observer
class About extends React.Component {
  render() {
    const { contacts, threads, notifiers } = this.props;
    return (
      <div>
        <Modal
          visible={contacts.contactPublicKey !== null}
          footer={null}
          centered
          closable
          onCancel={() => {
            contacts.toggleContactInfo(null);
          }}
        >
          <p>Full name</p>
          <h2>
            <Paragraph
              editable={{
                onChange: value => {
                  contacts
                    .saveContact(contacts.contactPublicKey, value)
                    .then(res => {
                      notifiers.success(res);
                    })
                    .catch(e => {
                      notifiers.error(e);
                    });
                },
              }}
            >
              {contacts.list &&
              contacts.list.filter(
                el => el.publicKey === contacts.contactPublicKey,
              ).length > 0
                ? contacts.list.filter(
                  el => el.publicKey === contacts.contactPublicKey,
                )[0].contact : 'Unknown sender'}
            </Paragraph>
          </h2>
          <p>Address / public key</p>
          <h2>{contacts.contactPublicKey}</h2>
          <Divider />
          <h3>Active threads</h3>
          {threads.list &&
            threads.list
              .filter(
                el =>
                  el.cdms[0].sharedWith.indexOf(contacts.contactPublicKey) > -1,
              )
              .map((item, i) => (
                <h4 key={`thread_hash_${item.threadHash}`}>
                  <button
                    type="button"
                    onClick={() => {
                      threads.setThread(item);
                      contacts.toggleContactInfo(null);
                    }}
                  >
                    {i + 1}. {item.cdms[0].subject}
                  </button>
                </h4>
              ))}
        </Modal>
        <style jsx>{`
          p {
            font-weight: 100;
            color: #999;
            margin: 0;
            font-size: 12px;
          }

          h2 {
            font-weight: 300;
            margin: 0;
            margin-bottom: 10px;
          }

          h3 {
            font-weight: 100;
          }

          h4 button {
            border: none;
            background: transparent;
            padding: 0;
            margin: 0;
            text-align: left;
            box-shadow: none;
            outline: 0;
            cursor: pointer;
            font-size: 12x;
            line-height: 14px;
          }

          h4 button:hover {
            color: #999;
          }
        `}</style>
      </div>
    );
  }
}

About.propTypes = {
  contacts: PropTypes.object,
  threads: PropTypes.object,
  notifiers: PropTypes.object,
};

export default About;
