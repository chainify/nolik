import React from 'react';
import PropTypes from 'prop-types';
import { keyPair } from '@waves/ts-lib-crypto';
import { observer, inject } from 'mobx-react';
import { Modal, Icon } from 'antd';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;

@inject('menu')
@observer
class About extends React.Component {
  render() {
    const { menu } = this.props;
    return (
      <div>
        <Modal
          visible={menu.showAboutModal}
          footer={null}
          centered
          closable
          onCancel={menu.toggleAboutModal}
        >
          <h1>What is Nolik</h1>
          <p>
            Nolik is a decentralized messaging application that is protected
            from data leakages. As a bonus, it is the fastest way to create
            immutable and secure conversations. Nolik is free and&nbsp;
            <a href="https://github.com/chainify/nolik" target="_blank">
              open-source
            </a>
            .
          </p>
          <p>
            At Nolik WE DO NOT STORE your decryption keys. The encryption and
            decryption of messages is made in the browser. It means that we will
            not be able to restore your keys if they will be lost or drop them
            if they will be compromised.
          </p>
        </Modal>
        <style jsx>{``}</style>
      </div>
    );
  }
}

About.propTypes = {
  menu: PropTypes.object,
};

export default About;
