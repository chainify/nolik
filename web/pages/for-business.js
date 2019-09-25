import React from 'react';
import PropTypes from 'prop-types';
import Router from 'next/router';
import { observer } from 'mobx-react';
import { Icon, Divider } from 'antd';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;

@observer
class WhatIsNolik extends React.Component {
  render() {
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
            <h1>Nolik for business</h1>
            <p>
              Nolik is the easiest way to connect with your customers, partners
              and colleagues. It allows to start secure convarsations with one
              click, and those conversations will be protected from surveillance
              and data leakages.
            </p>
            <p>
              Messages that were sent with nolik can&apos;t be deleted or
              modified. Each message is signed with digital signature and has a
              timestamp. That could be used for making contracts remotely.
            </p>
            <p>
              <a
                href={`${API_HOST}/pk/cEdRrkTRMkd61UdQHvs1c2pwLfuCXVTA4GaABmiEqrP?s=Sales%20Request`}
                target="_blank"
              >
                Contact sales
              </a>
            </p>
            <h2>What exactly do we offer</h2>
            <ul>
              <li>Branded Nolik with a corporate domain name</li>
              <li>
                Deployment to corporate (or our private) cloud infrastructure
              </li>
              <li>Restricting access to retired employees</li>
            </ul>
            <p>
              We will also take care of cryptocurrency economics*, data backups
              and software updates
            </p>
            <p>
              <a
                href={`${API_HOST}/pk/cEdRrkTRMkd61UdQHvs1c2pwLfuCXVTA4GaABmiEqrP?s=Sales%20Request`}
                target="_blank"
              >
                Contact sales
              </a>
            </p>
            <p className="cryptoDescr">
              * - payment of fees for sending blockchain transactions
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
            text-align: left;
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

WhatIsNolik.propTypes = {};

export default WhatIsNolik;
