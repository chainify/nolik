import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Menu, Icon, Divider, Dropdown, Button } from 'antd';
import { keyPair } from '@waves/ts-lib-crypto';

@inject('app', 'menu')
@observer
class MenuClass extends React.Component {
  render() {
    const { app, menu } = this.props;
    return (
      <div>
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
                <Menu>
                  {app.accounts.map(el => (
                    <Menu.Item key={`account_${el.publicKey}`}>
                      {el.publicKey}
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
          <Menu.Item key="copySeedPhrase" onClick={menu.copySeedPhrase}>
            <Icon type="copy" /> Copy seed phrase
          </Menu.Item>
          <Menu.Item key="importSeedPhrase" onClick={menu.copySeedPhrase}>
            <Icon type="import" /> Import seed phrase
          </Menu.Item>
          <Menu.Item disabled>
            <Divider />
          </Menu.Item>
          <Menu.Item key="copyChatUrl" onClick={menu.toggleShareModal}>
            <Icon type="share-alt" /> Share your one-time link
          </Menu.Item>
          {/* <Menu.Item
            key={'whatIsNolik'}
            onClick={infoModal}
          >
            <Icon type="info-circle" /> What is Nolik
          </Menu.Item> */}
          <Menu.Item disabled>
            <Divider />
          </Menu.Item>

          <Menu.Item key="contactNolik" onClick={menu.copySeedPhrase}>
            <Icon type="build" /> Contact Nolik
          </Menu.Item>
          <Menu.Item key="whatIsNolik" onClick={menu.copySeedPhrase}>
            <Icon type="question-circle" /> What is Nolik
          </Menu.Item>
          <Menu.Item disabled>
            <Divider />
          </Menu.Item>

          <Menu.Item key="logOut" onClick={menu.copySeedPhrase}>
            <Icon type="poweroff" /> Log Out
          </Menu.Item>
          {/* <Menu.Item
            onClick={() => {
                chat.selfClearChat();
            }}
          >
              <div className="dropChat">
                  <Icon type="reload" /> Reset account
              </div>
          </Menu.Item> */}
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
        `}</style>
      </div>
    );
  }
}

MenuClass.propTypes = {
  app: PropTypes.object,
  menu: PropTypes.object,
};

export default MenuClass;
