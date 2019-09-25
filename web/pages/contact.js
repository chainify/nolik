import React from 'react';
import PropTypes from 'prop-types';
import Router from 'next/router';
import { observer, inject } from 'mobx-react';
import { Icon } from 'antd';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;

@inject('index')
@observer
class Index extends React.Component {
  render() {
    const { index } = this.props;
    return (
      <div>
        <div className="main">
          <div className="header">
            <button
              type="button"
              className="menuButton"
              onClick={() => {
                Router.push('/');
              }}
            >
              <Icon type="left" />
            </button>
          </div>
          <div className="container">
            <h1>Contact</h1>
            <p>
              The best way to contact is to use Nolik. No app installation or
              registration needed. Just click a link and start messaging.
            </p>
            <p>
              <a
                href={`${API_HOST}/pk/cEdRrkTRMkd61UdQHvs1c2pwLfuCXVTA4GaABmiEqrP`}
                target="_blank"
              >
                Start conversation
              </a>
            </p>
          </div>
        </div>
        <style jsx>{`
          .main {
            min-height: 100vh;
            background: #2196f3;
            color: #fff;
            font-family: 'Montserrat', sans-serif;
          }

          .header {
            width: 100%;
            height: calc(32px + 2em);
            padding: 2em 2em 0 2em;
            text-align: left;
          }

          .menuButton {
            border: none;
            background: transparent;
            padding: 0;
            margin: 0;
            width: 100%;
            text-align: left;
            box-shadow: none;
            outline: 0;
            cursor: pointer;
            height: 32px;
            width: 40px;
            font-size: 32px;
            line-height: 32px;
            text-align: center;
          }

          .container {
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
            padding: 4em 2em;
          }

          .container h1 {
            font-size: 2.4em;
            color: #000;
            margin: 0 0 1em 0;
          }

          .container h2 {
            font-size: 2em;
            color: #000;
            margin: 0 0 1em 0;
          }

          .container p {
            font-size: 1.6em;
            line-height: 1.4em;
          }

          .container ul li {
            font-size: 1.6em;
            line-height: 1.4em;
          }

          .container p a {
            color: #fff;
            text-decoration: underline;
          }

          .container p button {
            border: none;
            background: transparent;
            padding: 0;
            margin: 0;
            text-align: center;
            box-shadow: none;
            outline: 0;
            cursor: pointer;
            color: #fff;
            font-weight: 400;
            text-decoration: underline;
          }

          .container p.offer {
            margin: 0 0 0.4em 0;
          }

          .container p.cryptoDescr {
            font-size: 1em;
          }
        `}</style>
      </div>
    );
  }
}

Index.propTypes = {
  index: PropTypes.object,
};

export default Index;
