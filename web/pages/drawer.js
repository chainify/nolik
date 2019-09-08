import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Drawer } from 'antd';
import Menu from './menu';

@inject('threads', 'utils')
@observer
class DrawerClass extends React.Component {
  render() {
    const { threads, utils } = this.props;
    return (
      <div className="main">
        <div className="content">
          <Drawer
            title="Nolik messenger"
            placement="right"
            closable
            mask={false}
            // onClose={chat.toggleShowDrawer}
            visible
          >
            <Menu />
          </Drawer>
        </div>
        <style jsx>{`
          .main {
            height: 100vh;
          }

          h1 {
            font-size: 32px;
            margin: 0;
            line-height: 32px;
            font-weight: 300;
          }
        `}</style>
      </div>
    );
  }
}

DrawerClass.propTypes = {
  threads: PropTypes.object,
  utils: PropTypes.object,
};

export default DrawerClass;
