import React from 'react';
import PropTypes from 'prop-types';
import { autorun } from 'mobx';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { Input, Icon, Button } from 'antd';
import mouseTrap from 'react-mousetrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

import ChatList from './list';

const { TextArea } = Input;

@inject('chat', 'cdms', 'threads')
@observer
class ChatNew extends React.Component {
  componentDidMount() {
    const { chat, cdms, threads } = this.props;
    this.props.bindShortcut('meta+enter', () => {
      cdms.sendThreadCdm();
    });

    this.props.bindShortcut('esc', () => {
      chat.toggleFocus();
    });

    if (threads.current) {
      chat.toRecipients = threads.current.members;
    }
  }

  render() {
    const { chat, cdms } = this.props;

    return (
      <div className="main">
        <div className="container">
          <div className="messages">
            <ChatList focus />
          </div>
          <div className="sideBar">
            <button
              type="button"
              onClick={() => {
                chat.toggleFocus();
              }}
              className="menuButton"
            >
              <Icon type="close" />
            </button>
          </div>
        </div>
        <div className="form">
          <div className="textArea">
            <TextArea
              placeholder="White your message"
              value={chat.message}
              onChange={e => {
                chat.message = e.target.value;
              }}
              autosize={{ minRows: 4, maxRows: 12 }}
              autoFocus
              className="mousetrap"
              style={{
                border: 'none',
                background: 'transparent',
                margin: 0,
                padding: '0 0px',
                outline: 'none',
                boxShadow: 'none',
                fontSize: '20px',
                lineHeight: '24px',
                height: '40px',
                resize: 'none',
                caretColor: '#2196f3',
              }}
            />
          </div>
          <div className="formButtons">
            <button
              type="button"
              className="paperPlane"
              disabled={chat.message.trim() === ''}
              onClick={() => {
                cdms.sendThreadCdm();
              }}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
        <style jsx>{`
          .main {
            height: 100vh;
            display flex;
            flex-direction: column;
          }

          .container {
            height: 50vh;
            display: flex;
            overflow-y: hidden;
          }

          .container .messages {
            flex: 1;
            display: flex;
            overflow-y: hidden;
          }

          .container .sideBar {
            width: 40px;
            padding: 1em 4px;
            text-align: center;
          }

          .form {
            min-height: 100px;
            padding: 2em 1em;
            display: flex;
            flex-direction: row;
          }

          .textArea {
            max-height: 400px;
            flex-grow: 1;
          }

          .formButtons {
            width: 60px;
            text-align: right;
          }

          .formButtons button {
            border: none;
            background: #fff;
            padding: 0;
            margin: 0 0 6px 0;
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

          button.paperPlane {
            color: #2196f3;
          }

          .formButtons button:disabled {
            color: #ddd;
            cursor: not-allowed;
          }

          .formButtons button:enabled:hover {
            color: #90caf9;
          }

          .menuButton {
            border: none;
            background: transparent;
            padding: 0;
            margin: 0;
            width: 100%;
            text-align: left;
            box-shadow: none;
            outline: 0;
            cursor: pointer;
            height: 32px;
            width: 32px;
            font-size: 20px;
            line-height: 32px;
            text-align: center;
          }
        `}</style>
      </div>
    );
  }
}

ChatNew.propTypes = {
  chat: PropTypes.object,
  cdms: PropTypes.object,
  bindShortcut: PropTypes.func,
  threads: PropTypes.object,
};

export default mouseTrap(ChatNew);
