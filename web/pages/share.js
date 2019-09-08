import React from 'react';
import PropTypes from 'prop-types';
import { keyPair } from '@waves/ts-lib-crypto';
import { observer, inject } from 'mobx-react';
import { Result, Modal, Icon } from 'antd';
import getConfig from 'next/config';
import {
  TelegramShareButton,
  TelegramIcon,
  WhatsappShareButton,
  WhatsappIcon,
  EmailShareButton,
  EmailIcon,
} from 'react-share';

const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;

const CopyIcon = function() {
  return (
    <div className="copyIcon">
      <Icon type="copy" />
    </div>
  );
};

@inject('app', 'menu')
@observer
class Share extends React.Component {
  render() {
    const { app, menu } = this.props;
    return (
      <div>
        <Modal
          visible={menu.showShareModal}
          footer={null}
          centered
          closable
          onCancel={menu.toggleShareModal}
        >
          <Result
            status="success"
            title="Ready to accept messages"
            subTitle="Share the link to one-time chat with you"
            extra={[
              <div className="socialIcons" key="socialIcons">
                <div className="socialIcon" key="telegram">
                  <TelegramShareButton
                    url={`${API_HOST}/pk/${keyPair(app.seed).publicKey}`}
                  >
                    <TelegramIcon />
                  </TelegramShareButton>
                </div>
                <div className="socialIcon" key="whatsapp">
                  <WhatsappShareButton
                    url={`${API_HOST}/pk/${keyPair(app.seed).publicKey}`}
                  >
                    <WhatsappIcon />
                  </WhatsappShareButton>
                </div>
                <div className="socialIcon" key="email">
                  <EmailShareButton
                    url={`${API_HOST}/pk/${keyPair(app.seed).publicKey}`}
                  >
                    <EmailIcon />
                  </EmailShareButton>
                </div>
                <div className="socialIcon" key="copy">
                  <button
                    type="button"
                    className="copyIcon"
                    onClick={() => {
                      menu.copyChatUrl();
                    }}
                  >
                    <CopyIcon />
                  </button>
                </div>
              </div>,
            ]}
          />
        </Modal>
        <style jsx>{`
          .socialIcon {
            border-radius: 10px;
            display: inline-block;
            overflow: hidden;
            margin-left: 2px;
            margin-right: 2px;
            opacity: 0.8;
          }

          .socialIcon:hover {
            opacity: 1;
            cursor: pointer;
          }

          .copyIcon {
            width: 64px;
            height: 64px;
            border: none;
            background: #eee;
            padding: 0;
            margin: 0;
            box-shadow: none;
            outline: 0;
            color: #999;
            font-size: 32px;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }
}

Share.propTypes = {
  app: PropTypes.object,
  menu: PropTypes.object,
};

export default Share;
