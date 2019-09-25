import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Icon } from 'antd';
import Router from 'next/router';

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faInbox } from '@fortawesome/free-solid-svg-icons';

import IndexIndex from './index/index';
import IndexMenu from './index/menu';

@inject('index', 'app')
@observer
class Index extends React.Component {
  render() {
    const { index, app } = this.props;
    return (
      <div>
        <div className="main">
          <div className="header">
            {app.accounts ? (
              <button
                type="button"
                className="menuButton"
                onClick={() => {
                  Router.push('/app');
                  // index.toggleMenu();
                }}
              >
                {app.accounts.length === 0 ? (
                  <div>
                    <span>Start</span>&nbsp;
                    <Icon type="user" />
                  </div>
                ) : (
                  <div>
                    {/* 0 <FontAwesomeIcon icon={faInbox} /> */}
                    {/* 0 <Icon type="inbox" /> */}
                    <Icon type="user" />
                  </div>
                )}
                {/* <Icon type={index.showMenu ? 'close' : 'user'} /> */}
              </button>
            ) : (
              <div className="loadingIcon">
                <Icon type="loading" />
              </div>
            )}
          </div>
          <div className="container">
            {index.showMenu ? <IndexMenu /> : <IndexIndex />}
          </div>
          <div className="footer">
            <div className="footerItem">
              <Icon type="github" />
              &nbsp;
              <a href="https://github.com/chainify/nolik" target="_blank">
                Github
              </a>
            </div>
            <div className="footerItem">
              <button
                type="button"
                onClick={() => {
                  Router.push('/for-business');
                }}
              >
                For business
              </button>
            </div>
            <div className="footerItem">
              <button
                type="button"
                onClick={() => {
                  Router.push('/what-is-nolik');
                }}
              >
                About
              </button>
            </div>
          </div>
        </div>
        <style jsx>{`
          .main {
            height: 100vh;
            background: #2196f3;
            color: #fff;
            font-family: 'Montserrat', sans-serif;
          }

          .header {
            height: calc(32px + 2em);
            padding: 2em 2em 0 2em;
            text-align: right;
          }

          .menuButton {
            border: none;
            background: transparent;
            padding: 0;
            margin: 0;
            text-align: left;
            box-shadow: none;
            outline: 0;
            cursor: pointer;
            height: 32px;
            font-size: 32px;
            line-height: 32px;
            text-align: right;
          }

          .menuButton span {
            text-decoration: underline;
            // font-size: 0.75em;
            line-height: 32px;
          }

          .container {
            height: calc(100vh - 32px - 2em - 20px - 2em);
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
            display: flex;
          }

          .footer {
            height: 20px;
            width: 100%;
            padding: 0 2em 2em 2em;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
          }

          .footerItem {
            display: inline-block;
            margin-right: 20px;
          }

          .footerItem a {
            text-decoration: underline;
            color: #eee;
          }

          .footerItem button {
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

          .menu {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: 100%;
            z-index: 100;
            display: none;
          }

          .menu.active {
            display: block;
          }

          .loadingIcon {
            font-size: 2em;
          }
        `}</style>
      </div>
    );
  }
}

Index.propTypes = {
  index: PropTypes.object,
  app: PropTypes.object,
};

export default Index;
