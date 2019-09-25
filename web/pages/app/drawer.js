import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Drawer } from 'antd';
import Menu from './menu';

@inject('app')
@observer
class DrawerClass extends React.Component {
  render() {
    const { app } = this.props;
    return (
      <div className="main">
        <div className="content">
          <Drawer
            title="Nolik messenger"
            placement="left"
            closable
            onClose={app.toggleDrawer}
            visible={app.showDrawer}
            width={320}
          >
            <Menu />
          </Drawer>
        </div>
        <style jsx>{`
          .main {
            // height: 100vh;
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
  app: PropTypes.object,
};

export default DrawerClass;
