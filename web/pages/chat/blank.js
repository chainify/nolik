import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Icon, Button } from 'antd';

import PageHeader from '../../components/PageHeader';

@inject('app', 'menu', 'chat')
@observer
class ChatBlank extends React.Component {
  render() {
    const { app, menu, chat } = this.props;
    return (
      <div>
        <div className="main">
          <PageHeader
            transparent
            goBack={
              <button
                type="button"
                shape="circle"
                className="menuButton"
                onClick={app.toggleDrawer}
              >
                <Icon type="menu" />
              </button>
            }
            extra={[
              <button
                type="button"
                className="menuButton"
                onClick={() => {
                  chat.compose([]);
                }}
              >
                <Icon type="form" />
              </button>,
            ]}
          />
          <div className="container">
            <div className="content">
              <img
                src="/static/empty.svg"
                width="200"
                // height="200"
                alt="empty"
              />
              <p>Ready to accept messages</p>
              <p>
                <Button
                  type="primary"
                  size="default"
                  onClick={menu.toggleShareModal}
                >
                  <Icon type="share-alt" /> Share your address
                </Button>
              </p>
            </div>
          </div>
        </div>
        <style jsx>{`
          .main {
            height: 100vh;
          }

          .container {
            height: calc(100vh - 52px);
            width: 100%;
            display: flex;
          }

          .content {
            width: 100%;
            align-self: center;
            text-align: center;
          }

          .content p {
            color: #999;
            margin-bottom: 2em;
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
        `}</style>
      </div>
    );
  }
}

ChatBlank.propTypes = {
  app: PropTypes.object,
  menu: PropTypes.object,
  chat: PropTypes.object,
};

export default ChatBlank;
