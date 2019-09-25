import React from 'react';
import PropTypes from 'prop-types';
import Router from 'next/router';
import { observer } from 'mobx-react';
import { Icon } from 'antd';

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
            <h1>What is Nolik</h1>
            <p>
              Nolik is a thread-based messaging application that is perfect for
              external conversations. It can be used by individuals and
              companies. It is build based on&nbsp;
              <a
                href="https://github.com/chainify/nolik#cdm-protocol"
                target="_blank"
              >
                CDM protocol
              </a>
              &nbsp;, that is designed to protect conversations from
              surveillance and data leakages.
            </p>
            <h2>What&apos;s the difference</h2>
            <p>
              You can audit that your messages were encrypted, sent, and stored
              securely. Unfortunately, that is not impossible to do with popular
              messaging applications.
            </p>
            <p>
              Also, to start messaging, you don&apos;t have to download an app
              and register account. Just click a link. It is that simple.
            </p>
            <h2>What are the features</h2>
            <ul>
              <li>Start messaging with one click, no registration needed</li>
              <li>Auditability of message delivery</li>
              <li>Digital signature with every message</li>
              <li>Messages can&apos;t be deleted or modified</li>
              <li>
                Provable protection from unauthorized access and data leakages
              </li>
              <li>Provable timestamping for every message</li>
              <li>Provable content for every message</li>
              <li>Provable sender and recipient for every message</li>
              <li>P2P and group messaging</li>
              <li>Multi-account system</li>
              <li>Open-source code under MIT license</li>
              <li>Access to messages even if Nolik will stop operating</li>
            </ul>
            <h2>How it works</h2>
            <p>
              Under the hood Nolik uses a combination of Blockchain and IPFS
              technologies, which provides an unprecedented level of
              transparency and security. You can find out more on official&nbsp;
              <a href="https://github.com/chainify/nolik" target="_blank">
                github page
              </a>
              .
            </p>
            <p>
              At Nolik there is no user registration with login and password.
              Instead every user automatically generates a key pair (a private
              and a public key). That key pair is used to encrypt and decrypt
              messages. Nolik does not have an access to that key pair and does
              not store them. The IPFS technology is a data storage level, that
              stores encrypted messages. Every user can have an access to
              encrypted data and decrypt it using Nolik or any other software.
            </p>

            <h2>Nolik for business</h2>
            <p>
              Companies have an option to deploy branded Nolik on corporate
              servers. Nolik is open-source and under MIT license. However in
              that case companies will have to handle cryptocurrency economics,
              data backups, software updates and bug fixes. We can take care of
              that low-level part of technology and let companirs focus on their
              business.
            </p>
            <p>
              <button
                type="button"
                onClick={() => {
                  Router.push('/for-business');
                }}
              >
                Learn more about corporate edition
              </button>
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
            text-align: left;
            box-shadow: none;
            outline: 0;
            cursor: pointer;
            color: #fff;
            font-weight: 400;
            text-decoration: underline;
          }
        `}</style>
      </div>
    );
  }
}

WhatIsNolik.propTypes = {};

export default WhatIsNolik;
