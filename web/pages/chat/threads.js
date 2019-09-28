import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Button, Icon } from 'antd';
import Skeleton from '../../components/Skeleton';
import PageHeader from '../../components/PageHeader';
import Thread from '../../components/Thread';

@inject('app', 'threads', 'chat')
@observer
class Threads extends React.Component {
  render() {
    const { app, threads, chat } = this.props;
    const skeleton = [...Array(6)].map((_, index) => (
      <Skeleton key={`skeleton_${index}`} />
    ));
    return (
      <div className="container">
        <PageHeader
          goBack={
            <button
              type="button"
              className="menuButton"
              onClick={app.toggleDrawer}
            >
              <Icon type="menu" />
            </button>
          }
          extra={[
            <button
              type="button"
              shape="circle"
              className="menuButton"
              onClick={() => {
                chat.compose([]);
              }}
            >
              <Icon type="form" />
            </button>,
          ]}
          transparent
        />
        <div className="list">
          {threads.list === null && skeleton}
          {threads.list && threads.list.length === 0 && (
            <div className="noMessages">
              <p>No messages yet</p>
            </div>
          )}
          {threads.list &&
            threads.list.length > 0 &&
            threads.list.map(el => (
              <Thread item={el} key={`thread_${el.threadHash}`} />
            ))}
        </div>
        <style jsx>{`
          .container {
            height: 100vh;
            border-right: 4px solid #f5f5f5;
          }

          .list {
            height: calc(100vh - 52px);
            border-top: 1px solid #eee;
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

          .noMessages {
            padding: 2em;
            width: 100%;
            display: block;
            text-align: center;
          }
        `}</style>
      </div>
    );
  }
}

Threads.propTypes = {
  app: PropTypes.object,
  threads: PropTypes.object,
  chat: PropTypes.object,
};

export default Threads;
