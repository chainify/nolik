import React from 'react';
import PropTypes from 'prop-types';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { Icon } from 'antd';
import mouseTrap from 'react-mousetrap';

// @inject('app')
@observer
class Loading extends React.Component {
  render() {
    return (
      <div>
        <div className="main">
          <div className="content">
            <h1>
              <Icon type="loading" /> Generating ecryption keys...
            </h1>
          </div>
        </div>
        <style jsx>{`
          .main {
            height: 100vh;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
          }

          .content {
            position: absolute;
            right: 2em;
            bottom: 4em;
          }

          h1 {
            font-size: 1em;
            margin: 0;
            font-family: 'Muli', sans-serif;
            color: #333;
          }
        `}</style>
      </div>
    );
  }
}

Loading.propTypes = {};

export default withRouter(mouseTrap(Loading));
