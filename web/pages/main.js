import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Row, Col } from 'antd';

import Threads from './threads';
import Share from './share';
import Drawer from './drawer';
import Menu from './menu';

@inject('threads')
@observer
class Main extends React.Component {
  render() {
    const { threads } = this.props;
    return (
      <div className="main">
        <Row>
          <Col xs={6}>
            <Threads />
          </Col>
          <Col xs={12}>
            {threads.list === null && <Share />}
          </Col>
          <Col xs={6}>
            <div className="menu">
              <Menu />
            </div>
          </Col>
        </Row>
        <style jsx>{`
          .main {
            height: 100vh;
          }

          .menu {
            border-left: 1px solid #ddd;
            height: 100vh;
            padding: 1em 2em;
          }
        `}</style>
      </div>
    );
  }
}

Main.propTypes = {
  threads: PropTypes.object,
};

export default Main;
