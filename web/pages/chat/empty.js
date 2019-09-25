import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Icon, Button } from 'antd';
// import mouseTrap from 'react-mousetrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import PageHeader from '../../components/PageHeader';


@inject('app', 'menu', 'chat')
@observer
class ChatIndex extends React.Component {
  render() {
    const { app, menu, chat } = this.props;
    return (
      <div>
        <div className="main">
          <div className="container">
            <div className="content">
              <img
                src="/static/empty.svg"
                width="200"
                // height="200"
                alt="empty"
              />
            </div>
          </div>
        </div>
        <style jsx>{`
          .main {
            height: calc(100vh - 52px);
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

ChatIndex.propTypes = {
  app: PropTypes.object,
  menu: PropTypes.object,
  chat: PropTypes.object,
};

export default ChatIndex;
