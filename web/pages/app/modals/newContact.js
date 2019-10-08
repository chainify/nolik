import React from 'react';
import PropTypes from 'prop-types';
import { keyPair } from '@waves/ts-lib-crypto';
import { observer, inject } from 'mobx-react';
import { Modal, Input, Button } from 'antd';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;

@inject('contacts', 'notifiers')
@observer
class NewContact extends React.Component {
  render() {
    const { contacts, notifiers } = this.props;
    return (
      <div>
        <Modal
          visible={contacts.showNewContactModal}
          footer={[
            <Button
              type="primary"
              key="saveContactButton"
              onClick={() => {
                contacts.saveNewContact();
              }}
              disabled={
                contacts.newPublicKey === '' || contacts.newContactName === ''
              }
            >
              Save Contact
            </Button>,
          ]}
          centered
          closable
          onCancel={contacts.toggleNewContactModal}
        >
          <h1>New contact</h1>
          <p>
            <Input
              placeholder="Public Key"
              value={contacts.newPublicKey}
              onChange={e => {
                contacts.newPublicKey = e.target.value;
              }}
              onPressEnter={() => {
                contacts.saveNewContact();
              }}
            />
          </p>
          <p>
            <Input
              placeholder="Contact name"
              value={contacts.newContactName}
              onChange={e => {
                contacts.newContactName = e.target.value;
              }}
              onPressEnter={() => {
                contacts.saveNewContact();
              }}
            />
          </p>
        </Modal>
        <style jsx>{``}</style>
      </div>
    );
  }
}

NewContact.propTypes = {
  contacts: PropTypes.object,
  notifiers: PropTypes.object,
};

export default NewContact;
