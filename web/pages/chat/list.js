import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Divider } from 'antd';
import * as moment from 'moment';
import Message from '../../components/Message';

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
    const { threads, focus } = this.props;
    let daystamp = null;
    return (
      <div className={`list ${focus ? 'focus' : ''}`}>
        {threads.current.cdms.map(el => {
          const currentDaystamp = moment(el.timestamp * 1000).format('MMDD');
          if (currentDaystamp !== daystamp) {
            daystamp = currentDaystamp;
            return [
              <Divider key={`divider_${el.timestamp}`}>
                {moment(el.timestamp * 1000).format('LL')}
              </Divider>,
              <Message item={el} focus={focus} key={`message_${el.id}`} />,
            ];
          }
          return <Message item={el} focus={focus} key={`message_${el.id}`} />;
        })}
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
        `}</style>
      </div>
    );
  }
}

ChatList.propTypes = {
  threads: PropTypes.object,
  focus: PropTypes.bool,
};

export default ChatList;
