import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import * as moment from 'moment';
import { keyPair } from '@waves/ts-lib-crypto';
import getConfig from 'next/config';
import mdcss from '../../styles/MarkDown.css';

const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;

const md = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

@inject('threads', 'app', 'chat')
@observer
class ChatList extends React.Component {
  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.containerDiv.scrollIntoView({ behavior: 'auto' });
  }

  render() {
    const { threads, app, focus, chat } = this.props;
    const css = `<style>${mdcss}</style>`;
    return (
      <div className={`list ${focus ? 'focus' : ''}`}>
        {threads.current.cdms.map(el => (
          <div key={`el_${el.id}`} className="messageRow">
            <div className={`timestamp ${focus ? 'focus' : ''}`}>
              <a href={`${API_HOST}/explorer/cdm/${el.id}`} target="_blank">
                {moment(el.timestamp * 1000).format('h:mm')}
              </a>
            </div>
            <div className="messageContainer">
              <div className={`sender ${focus ? 'focus' : ''}`}>
                {el.logicalSender === keyPair(app.seed).publicKey ? (
                  'You'
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      chat.compose([el.logicalSender]);
                    }}
                  >
                    {`${el.logicalSender.substring(0, 16)}...`}
                  </button>
                )}
              </div>
              {el.subject && <p className="subject">{el.subject}</p>}
              <div
                className="message markdown"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: `${css}${md.render(el.message)}`,
                }}
              />
            </div>
          </div>
        ))}
        <div
          ref={el => {
            this.containerDiv = el;
          }}
        />
        <style jsx>{`
          .list {
            flex: 1;
            display: flex;
            padding: 1em;
            overflow-y: auto;
            flex-direction: column;
            justify-content: flex-start;
          }

          .list.focus {
            font-size: 16px;
          }

          .messageRow {
            display: flex;
          }

          .messageRow .timestamp {
            min-width: 50px;
          }

          .messageRow .timestamp {
            margin: 0;
            font-size: 12px;
            line-height: 14px;
            color: #999;
          }

          .messageRow .timestamp button {
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
            color: #999;
          }

          .messageRow .timestamp button:hover {
            color: #42a5f5;
          }

          .messageRow .timestamp.focus {
            display: none;
          }

          .messageRow .messageContainer {
            flex-grow: 1;
          }

          .sender {
            margin: 0;
            font-size: 12px;
            line-height: 14px;
            color: #999;
          }

          .sender button {
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
            color: #999;
          }

          .sender button:hover {
            color: #42a5f5;
          }

          .seder.focus {
            display: none;
          }

          .subject {
            margin: 0;
            font-size: 1.2em;
          }

          .message {
            margin: 0;
            font-size: 1em;
            font-weight: 300;
            padding-bottom: 1.2em;
          }
        `}</style>
      </div>
    );
  }
}

ChatList.propTypes = {
  threads: PropTypes.object,
  app: PropTypes.object,
  focus: PropTypes.bool,
  chat: PropTypes.object,
};

export default ChatList;
