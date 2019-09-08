import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Menu, Icon, Divider } from 'antd';

const { SubMenu } = Menu;

@inject('app', 'threads')
@observer
class Threads extends React.Component {
  render() {
    const { app, threads } = this.props;
    return (
      <div>
        <div className="list">

        </div>
        <style jsx>{`
          .list {
            height: 100vh;
            border-right: 1px solid #ddd;
          }
        `}</style>
      </div>
    );
  }
}

Threads.propTypes = {
  app: PropTypes.object,
  threads: PropTypes.object,
};

export default Threads;
