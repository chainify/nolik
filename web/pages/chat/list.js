import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import * as moment from 'moment';
import { keyPair } from '@waves/ts-lib-crypto';

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
    const { threads, app, focus } = this.props;
    return (
      <div className={`list ${focus ? 'focus' : ''}`}>
        {threads.current.cdms.map(el => (
          <div key={`el_${el.id}`} className="messageRow">
            <div className={`timestamp ${focus ? 'focus' : ''}`}>
              <p>{moment(el.timestamp * 1000).format('h:mm')}</p>
            </div>
            <div className="messageContainer">
              <p className={`sender ${focus ? 'focus' : ''}`}>
                {el.logicalSender === keyPair(app.seed).publicKey
                  ? 'You'
                  : `${el.logicalSender.substring(0, 16)}...`}
              </p>
              {el.subject && <p className="subject">{el.subject}</p>}
              <p className="message">{el.message}</p>
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
            width: 50px;
          }

          .messageRow .timestamp p {
            margin: 0;
            font-size: 12px;
            color: #999;
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
            color: #999;
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
};

export default ChatList;
