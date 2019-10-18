import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Icon, Typography, Row, Col, Button, Divider } from 'antd';

import PageHeader from '../../components/PageHeader';
import NewContactModal from '../app/modals/newContact';
const { Paragraph } = Typography;

@inject('chat', 'contacts')
@observer
class Contacts extends React.Component {
  render() {
    const { chat, contacts } = this.props;
    return (
      <div>
        <NewContactModal />
        <div className="main">
          <PageHeader
            transparent
            title="Contacts"
            goBack={
              <button
                type="button"
                shape="circle"
                className="menuButton"
                onClick={chat.toggleContacts}
              >
                <Icon type="left" />
              </button>
            }
            extra={[
              <button
                type="button"
                className="menuButton"
                onClick={() => {
                  contacts.toggleNewContactModal();
                }}
              >
                <Icon type="user-add" />
              </button>,
            ]}
          />
          <div className="container">
            {contacts.pinned && contacts.pinned.length === 0 && (
              <p>No pinned contacts</p>
            )}
            {contacts.pinned &&
              contacts.pinned.map(el => (
                <Row key={`contact_${el.publicKey}`}>
                  <Col xs={4} md={2}>
                    <div className="pin">
                      <Button
                        shape="circle"
                        icon="pushpin"
                        type="primary"
                        onClick={() => {
                          contacts.saveContact(el.publicKey, el.contact);
                        }}
                      />
                    </div>
                  </Col>
                  <Col xs={20} md={8}>
                    <div className="contactName">
                      <Paragraph
                        editable={{
                          onChange: value => {
                            contacts.pinContact(el.publicKey, value);
                          },
                        }}
                      >
                        {el.contact}
                      </Paragraph>
                    </div>
                  </Col>
                  <Col xs={24} md={14}>
                    <div className="publicKey">{el.publicKey}</div>
                  </Col>
                </Row>
              ))}
            <Divider />
            {contacts.saved && contacts.saved.length === 0 && (
              <p>All contacts has been pinned</p>
            )}
            {contacts.saved &&
              contacts.saved.map(el => (
                <Row key={`contact_${el.publicKey}`}>
                  <Col xs={4} md={2}>
                    <div className="pin">
                      <Button
                        shape="circle"
                        icon="pushpin"
                        type="default"
                        onClick={() => {
                          contacts.pinContact(el.publicKey, el.contact);
                        }}
                      />
                    </div>
                  </Col>
                  <Col xs={20} md={8}>
                    <div className="contactName">
                      <Paragraph
                        editable={{
                          onChange: value => {
                            contacts.saveContact(el.publicKey, value);
                          },
                        }}
                      >
                        {el.contact}
                      </Paragraph>
                    </div>
                  </Col>
                  <Col xs={24} md={14}>
                    <div className="publicKey">{el.publicKey}</div>
                  </Col>
                </Row>
              ))}
          </div>
        </div>
        <style jsx>{`
          .main {
            height: 100vh;
          }

          .container {
            height: calc(100vh - 52px);
            width: 100%;
            padding: 4em;
            overflow-y: auto;
          }

          .menuButton {
            border: none;
            background: #fff;
            padding: 0;
            margin: 0;
            width: 100%;
            text-align: left;
            box-shadow: none;
            outline: 0;
            cursor: pointer;
            height: 32px;
            width: 40px;
            font-size: 20px;
            line-height: 32px;
            text-align: center;
          }

          .menuButton:hover {
            color: #eee;
          }

          .publicKey {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 32px;
            font-size: 14px;
          }

          .pin {
            cursor: pointer;
            font-size: 20px;
            line-height: 32px;
          }

          .contactName {
            padding-bottom: 1em;
            line-height: 32px;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }
}

Contacts.propTypes = {
  chat: PropTypes.object,
  contacts: PropTypes.object,
};

export default Contacts;
