import React from 'react';
import PropTypes from 'prop-types';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { Row, Col } from 'antd';
import mouseTrap from 'react-mousetrap';

import Main from './main';
import Loading from './loading';

@inject('app')
@observer
class Index extends React.Component {
  componentDidMount() {
    const { app } = this.props;
    app.initLevelDB();
    app.init();
  }

  render() {
    const { app } = this.props;
    return (
      <div>
        <div className="main">{app.accounts ? <Main /> : <Loading />}</div>
        <style jsx>{`
          .main {
            height: 100vh;
            // background: url(static/pencils.jpg) no-repeat left top fixed;
            // -webkit-background-size: cover;
            // -moz-background-size: cover;
            // -o-background-size: cover;
            // background-size: cover;
          }
        `}</style>
      </div>
    );
  }
}

Index.propTypes = {
  app: PropTypes.object,
};

export default withRouter(mouseTrap(Index));
