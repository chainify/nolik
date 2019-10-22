import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Button, Icon } from 'antd';
import * as moment from 'moment';
import { keyPair } from '@waves/ts-lib-crypto';
import getConfig from 'next/config';
import mdcss from '../styles/MarkDown.css';

const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;

const md = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

@inject('chat', 'app', 'contacts')
@observer
class Message extends React.Component {
  render() {
    const { item, focus, chat, app, contacts } = this.props;
    const css = `<style>${mdcss}</style>`;
    const matchedContacts =
      contacts.list &&
      contacts.list.filter(el => el.publicKey === item.logicalSender);
    return (
      <div className="messageRow">
        <div className={`timestamp ${focus ? 'focus' : ''}`}>
          <a href={`${API_HOST}/explorer/cdm/${item.id}`} target="_blank">
            {moment(item.timestamp * 1000).format('HH:mm')}
          </a>
        </div>
        <div className="messageContainer">
          {item.logicalSender && (
            <div className={`sender ${focus ? 'focus' : ''}`}>
              {item.logicalSender === keyPair(app.seed).publicKey ? (
                'You'
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    chat.compose([item.logicalSender]);
                  }}
                >
                  {matchedContacts && matchedContacts.length > 0
                    ? matchedContacts[0].contact
                    : ''}
                </button>
              )}
            </div>
          )}
          {item.subject && <p className="subject">{item.subject}</p>}
          <div
            className="message markdown"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: `${css}${md.render(item.message)}`,
            }}
          />
        </div>
        <style jsx>{`
          .messageRow {
            display: -webkit-box;
            display: -moz-box;
            display: -ms-flexbox;
            display: -ms-flexbox;
          }

          .messageRow .timestamp {
            margin: 0;
            min-width: 50px;
            font-size: 12px;
            line-height: 14px;
          }

          .messageRow .timestamp a {
            text-decoration: none;
            color: #42a5f5;
          }

          .messageRow .timestamp a:hover {
            color: #90caf9;
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
            max-width: calc(100vw - 120px);
            color: rgba(0, 0, 0, 1);
          }
        `}</style>
      </div>
    );
  }
}

Message.propTypes = {
  item: PropTypes.object,
  focus: PropTypes.bool,
  chat: PropTypes.object,
  app: PropTypes.object,
  contacts: PropTypes.object,
};

export default Message;
