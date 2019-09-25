import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import mouseTrap from 'react-mousetrap';
import { Input, Button, Icon } from 'antd';
import ChatList from './list';
import PageHeader from '../../components/PageHeader';

const { TextArea } = Input;

@inject('chat', 'cdms', 'threads')
@observer
class ChatIndex extends React.Component {
  componentDidMount() {
    const { chat, cdms, threads } = this.props;
    this.props.bindShortcut('meta+enter', () => {
      cdms.sendCdm();
    });

    this.props.bindShortcut('meta+e', () => {
      chat.toggleCompose();
    });

    this.props.bindShortcut('esc', () => {
      threads.setThread(null);
    });
  }
  render() {
    const { chat, cdms, threads } = this.props;
    return (
      <div>
        <div className="main">
          <div className="container">
            <div className="messages">
              <ChatList />
            </div>
            <div className="sideBar">
              <button
                type="button"
                onClick={() => {
                  threads.setThread(null);
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
                autosize={{ minRows: 2, maxRows: 12 }}
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
                  cdms.sendCdm();
                }}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
              <button
                type="button"
                onClick={() => {
                  chat.toggleCompose();
                }}
              >
                <Icon type="fullscreen" />
              </button>
            </div>
          </div>
        </div>
        <style jsx>{`
          .main {
            height: 100vh;
            display: flex;
            flex-direction: column;
          }

          .container {
            flex-grow: 1;
            display: flex;
            overflow-y: auto;
          }

          .container .messages {
            flex-grow: 1;
            display: flex;
            overflow-y: auto;
          }

          .container .sideBar {
            width: 40px;
            padding: 1em 4px;
            text-align: center;
          }

          .form {
            min-height: 100px;
            padding: 1em;
            display: flex;
            flex-direction: row;
            border-top: 1px solid #eee;
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

ChatIndex.propTypes = {
  chat: PropTypes.object,
  cdms: PropTypes.object,
  bindShortcut: PropTypes.func,
  threads: PropTypes.func,
};

export default mouseTrap(ChatIndex);
