import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import * as moment from 'moment';
import { Input, Row, Col } from 'antd';
import { keyPair } from '@waves/ts-lib-crypto';
import NoSSR from 'react-no-ssr';

@inject('threads', 'app')
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
    const { threads, app } = this.props;
    return (
      <div className="list">
        <NoSSR>
          {threads.current.cdms.map(el => (
            <div key={`el_${el.id}`} className="messageRow">
              <div className="timestamp">
                <p>{moment(el.timestamp * 1000).format('h:mm')}</p>
              </div>
              <div className="messageContainer">
                <p className="sender">
                  {el.logicalSender === keyPair(app.seed).publicKey
                    ? 'You'
                    : `${el.logicalSender.substring(0, 16)}...`}
                </p>
                {el.subject && <p className="subject">{el.subject}</p>}
                <p className="message">{el.message}</p>
              </div>
            </div>
          ))}
        </NoSSR>
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

          .messageRow {
            display: flex;
          }

          .messageRow .timestamp {
            width: 50px;
          }

          .messageRow .timestamp p {
            margin: 0;
            font-size: 12px;
            color: #999;
          }

          .messageRow .messageContainer {
            flex-grow: 1;
          }

          .sender {
            margin: 0;
            font-size: 12px;
            color: #999;
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
};

export default ChatList;
