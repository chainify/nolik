import React from 'react';
import PropTypes from 'prop-types';
import Router from 'next/router';
import { observer, inject } from 'mobx-react';
import { Icon } from 'antd';

@inject('app', 'index')
@observer
class IndexMenu extends React.Component {
  componentDidMount() {
    const { app } = this.props;
    // app.initAccountsDB();
    // app.init();
  }

  render() {
    const { app, index } = this.props;
    return (
      <div className="main">
        <div className="container">
          {!app.accounts && (
            <p>
              <Icon type="loading" />
            </p>
          )}
          {app.accounts && (
            <p>
              <button
                type="button"
                onClick={() => {
                  Router.push('/app');
                  index.toggleMenu();
                }}
              >
                {app.accounts.length === 0 ? 'Start messaging' : 'Login'}
              </button>
            </p>
          )}
          <p>
            <button
              type="button"
              onClick={() => {
                Router.push('/for-business');
                index.toggleMenu();
              }}
            >
              For business
            </button>
          </p>
          <p>
            <button
              type="button"
              onClick={() => {
                Router.push('/what-is-nolik');
                index.toggleMenu();
              }}
            >
              What is Nolik
            </button>
          </p>
          {/* <p>Terms of use</p> */}
          <p>
            <button
              type="button"
              onClick={() => {
                index.toggleMenu();
                Router.push('/contact');
                index.toggleMenu();
              }}
            >
              Contact
            </button>
          </p>
        </div>
        <style jsx>{`
          .main {
            height: inherit;
            width: inherit;
            display: flex;
          }

          .container {
            padding: 2em;
            align-self: center;
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
            font-size: 2em;
            color: #fff;
            font-weight: 400;
            text-decoration: underline;
          }
        `}</style>
      </div>
    );
  }
}

IndexMenu.propTypes = {
  app: PropTypes.object,
  index: PropTypes.object,
};

export default IndexMenu;
