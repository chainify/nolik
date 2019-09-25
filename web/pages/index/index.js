import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import Router from 'next/router';
import { Icon } from 'antd';

@inject('app')
@observer
class Index extends React.Component {
  componentDidMount() {
    const { app } = this.props;
    app.initAccountsDB();
    app.readAccounts();
  }

  render() {
    const { app } = this.props;
    return (
      <div className="main">
        <div className="container">
          <div className="disclaimer">
            <h1>
              <b>Nolik</b> instant messenger
            </h1>
            <p>
              {/* Nolik is the messenger that is protected from data leakage. It is
              also the fastest way to create immutable and secure conversations. */}
              It is the fastest way to create immutable and secure
              conversations. What makes Nolik unique is auditable protection
              from data leakages.
            </p>
          </div>
        </div>
        <style jsx>{`
          .main {
            height: inherit;
            width: inherit;
          }

          .container {
            height: inherit;
            width: inherit;
            display: flex;
            padding: 2em;
          }

          .disclaimer {
            align-self: center;
            max-width: 600px;
          }

          .disclaimer h1 {
            font-size: 2.4em;
            color: #000;
            margin: 0 0 1em 0;
          }

          .disclaimer p {
            font-size: 1.65em;
            line-height: 1.4em;
          }

          .disclaimer p a {
            color: #fff;
            text-decoration: none;
          }

          .getStartedButton {
            border: none;
            background: #fff;
            padding: 0em 1em;
            margin: 0;
            text-align: center;
            box-shadow: none;
            outline: 0;
            cursor: pointer;
            font-size: 0.6em;
            border-radius: 10px;
            color: #2196f3;
            font-weight: bold;
          }
        `}</style>
      </div>
    );
  }
}

Index.propTypes = {
  app: PropTypes.object,
};

export default Index;
