import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Menu, Icon, Divider, Dropdown, Button } from 'antd';
import { keyPair } from '@waves/ts-lib-crypto';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faKey } from '@fortawesome/free-solid-svg-icons';
import AboutModal from './modals/about';

@inject('app', 'menu', 'chat')
@observer
class MenuClass extends React.Component {
  render() {
    const { app, menu, chat } = this.props;
    return (
      <div>
        <AboutModal />
        <Menu
          mode="inline"
          inlineIndent={0}
          defaultSelectedKeys={[]}
          defaultOpenKeys={['accounts']}
          selectedKeys={[]}
          style={{
            borderRight: 0,
          }}
        >
          <Menu.Item>
            <Dropdown
              overlay={
                <Menu
                  onClick={item => {
                    const publicKey = item.key.replace('account_', '');
                    app.switchTo = publicKey;
                  }}
                >
                  <Menu.Item key="your_accounts" disabled>
                    <h4>Your accounts</h4>
                  </Menu.Item>
                  <Menu.Divider />
                  {app.accounts.map(el => (
                    <Menu.Item key={`account_${el.publicKey}`}>
                      <div className="account">
                        <div className="checked">
                          {keyPair(app.seed).publicKey === el.publicKey ? (
                            <Icon type="check" />
                          ) : null}
                        </div>
                        <div className="publicKey">
                          {`${el.publicKey.substring(
                            0,
                            4,
                          )}••••••••${el.publicKey.substring(
                            el.publicKey.length - 4,
                          )}`}
                        </div>
                      </div>
                    </Menu.Item>
                  ))}
                </Menu>
              }
              trigger={['click']}
            >
              <div>
                <Icon type="user" />
                <Button type="link" style={{ margin: 0, padding: 0 }}>
                  {`${keyPair(app.seed).publicKey.substring(
                    0,
                    4,
                  )}••••••••${keyPair(app.seed).publicKey.substring(
                    keyPair(app.seed).publicKey.length - 4,
                  )}`}
                  <Icon type="down" />
                </Button>
              </div>
            </Dropdown>
          </Menu.Item>
          <Menu.Item key="copySeedPhrase" onClick={menu.toggleBackupModal}>
            <Icon type="key" /> Backup phrase
          </Menu.Item>
          <Menu.Item key="importSeedPhrase" onClick={menu.toggleImportModal}>
            <Icon type="import" /> Import account
          </Menu.Item>
          <Menu.Item key="contacts" onClick={chat.toggleContacts}>
            <Icon type="contacts" /> Contacts
          </Menu.Item>
          <Menu.Item disabled>
            <Divider />
          </Menu.Item>
          <Menu.Item key="copyPublicKey" onClick={app.copyPublicKey}>
            <Icon type="copy" /> Copy public key
          </Menu.Item>
          <Menu.Item key="copyChatUrl" onClick={menu.toggleShareModal}>
            <Icon type="share-alt" /> Share your address
          </Menu.Item>
          <Menu.Item disabled>
            <Divider />
          </Menu.Item>
          <Menu.Item key="contactNolik" onClick={chat.writeToNolik}>
            <Icon type="build" /> Contact Founder
          </Menu.Item>
          <Menu.Item key="whatIsNolik" onClick={menu.toggleAboutModal}>
            <Icon type="question-circle" /> What is Nolik
          </Menu.Item>
          <Menu.Item disabled>
            <Divider />
          </Menu.Item>
          <Menu.Item
            key="passwordManagement"
            onClick={menu.togglePasswordModal}
          >
            <Icon type="lock" /> Password update
          </Menu.Item>
          <Menu.Item key="logOut" onClick={app.logOut}>
            <Icon type="poweroff" /> Log Out
          </Menu.Item>
        </Menu>
        <style jsx>{`
          .main {
            height: 100vh;
          }

          h1 {
            font-size: 32px;
            margin: 0;
            line-height: 32px;
            font-weight: 300;
          }

          h4 {
            margin: 0;
            font-weight: 400;
          }

          .account {
            display: flex;
            width: 100%;
          }

          .account .checked {
            width: 20px;
            text-align: center;
          }
          .account .publicKey {
            flex-grow: 1;
            text-align: left;
          }
        `}</style>
      </div>
    );
  }
}

MenuClass.propTypes = {
  app: PropTypes.object,
  menu: PropTypes.object,
  chat: PropTypes.object,
};

export default MenuClass;
