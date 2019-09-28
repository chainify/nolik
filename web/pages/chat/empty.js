import React from 'react';
import { observer } from 'mobx-react';

@observer
class ChatIndex extends React.Component {
  render() {
    return (
      <div>
        <div className="main">
          <div className="content">
            <img src="/static/empty.svg" width="200" alt="empty" />
          </div>
        </div>
        <style jsx>{`
          .main {
            height: calc(100vh - 52px);
            display: flex;
          }

          .content {
            width: 100%;
            align-self: center;
            text-align: center;
          }
        `}</style>
      </div>
    );
  }
}

ChatIndex.propTypes = {};

export default ChatIndex;
