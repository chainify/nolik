import React from 'react';
import PropTypes from 'prop-types';
import { keyPair } from '@waves/ts-lib-crypto';
import { observer, inject } from 'mobx-react';
import { Modal, Icon } from 'antd';
import getConfig from 'next/config';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import {
  faFacebook,
  faTelegram,
  faWhatsapp,
  faTwitter,
  faReddit,
  faLinkedin,
  faVk,
} from '@fortawesome/free-brands-svg-icons';

import {
  TelegramShareButton,
  WhatsappShareButton,
  EmailShareButton,
  TwitterShareButton,
  FacebookShareButton,
  RedditShareButton,
  LinkedinShareButton,
  VKShareButton,
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
          title="Share your address"
          footer={null}
          centered
          closable
          onCancel={menu.toggleShareModal}
        >
          <div className="options">
            <div className="option">
              <EmailShareButton
                url={`${API_HOST}/pk/${keyPair(app.seed).publicKey}`}
              >
                <div className="optionButton nobrand">
                  <div className="logo">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </div>
                  <div className="brand">Email</div>
                </div>
              </EmailShareButton>
            </div>
            <div className="option">
              <button
                type="button"
                onClick={() => {
                  menu.copyChatUrl();
                }}
              >
                <div className="optionButton nobrand">
                  <div className="logo">
                    <CopyIcon />
                  </div>
                  <div className="brand">Copy Link</div>
                </div>
              </button>
            </div>
            <div className="option">
              <FacebookShareButton
                url={`${API_HOST}/pk/${keyPair(app.seed).publicKey}`}
              >
                <div className="optionButton facebook">
                  <div className="logo">
                    <FontAwesomeIcon icon={faFacebook} />
                  </div>
                  <div className="brand">Facebook</div>
                </div>
              </FacebookShareButton>
            </div>
            <div className="option">
              <TwitterShareButton
                url={`${API_HOST}/pk/${keyPair(app.seed).publicKey}`}
              >
                <div className="optionButton twitter">
                  <div className="logo">
                    <FontAwesomeIcon icon={faTwitter} />
                  </div>
                  <div className="brand">Twitter</div>
                </div>
              </TwitterShareButton>
            </div>
            <div className="option">
              <LinkedinShareButton
                url={`${API_HOST}/pk/${keyPair(app.seed).publicKey}`}
              >
                <div className="optionButton linkedin">
                  <div className="logo">
                    <FontAwesomeIcon icon={faLinkedin} />
                  </div>
                  <div className="brand">LinkedIn</div>
                </div>
              </LinkedinShareButton>
            </div>
            <div className="option">
              <VKShareButton
                url={`${API_HOST}/pk/${keyPair(app.seed).publicKey}`}
              >
                <div className="optionButton vk">
                  <div className="logo">
                    <FontAwesomeIcon icon={faVk} />
                  </div>
                  <div className="brand">VKontakte</div>
                </div>
              </VKShareButton>
            </div>
            <div className="option">
              <RedditShareButton
                url={`${API_HOST}/pk/${keyPair(app.seed).publicKey}`}
              >
                <div className="optionButton reddit">
                  <div className="logo">
                    <FontAwesomeIcon icon={faReddit} />
                  </div>
                  <div className="brand">Reddit</div>
                </div>
              </RedditShareButton>
            </div>
            <div className="option">
              <TelegramShareButton
                url={`${API_HOST}/pk/${keyPair(app.seed).publicKey}`}
              >
                <div className="optionButton telegram">
                  <div className="logo">
                    <FontAwesomeIcon icon={faTelegram} />
                  </div>
                  <div className="brand">Telegram</div>
                </div>
              </TelegramShareButton>
            </div>
            <div className="option">
              <WhatsappShareButton
                url={`${API_HOST}/pk/${keyPair(app.seed).publicKey}`}
              >
                <div className="optionButton whatsapp">
                  <div className="logo">
                    <FontAwesomeIcon icon={faWhatsapp} />
                  </div>
                  <div className="brand">WhatsApp</div>
                </div>
              </WhatsappShareButton>
            </div>
          </div>
        </Modal>
        <style jsx>{`
          .option {
            display: block;
            width: 100%;
            margin-bottom: 12px;
          }

          .optionButton {
            width: 100%;
            height: 48px;
            display: flex;
            opacity: 0.9;
            color: #fff;
            border-radius: 4px;
          }

          .optionButton.nobrand {
            background: #eee;
            color: #666;
          }

          .optionButton:hover {
            cursor: pointer;
            opacity: 1;
          }

          .optionButton.telegram {
            background: #0088cc;
          }

          .optionButton.whatsapp {
            background: #25d366;
          }

          .optionButton.twitter {
            background: #1da1f2;
          }

          .optionButton.facebook {
            background: #3b5998;
          }

          .optionButton.reddit {
            background: #ff4500;
          }

          .optionButton.linkedin {
            background: #0077b5;
          }

          .optionButton.vk {
            background: #45668e;
          }

          .optionButton .logo {
            width: 48px;
            height: 48px;
            text-align: center;
            font-size: 32px;
            line-height: 48px;
          }

          .optionButton .brand {
            flex-grow: 1;
            text-align: center;
            font-size: 18px;
            line-height: 48px;
            padding-right: 24px;
          }

          .option button {
            width: 100%;
            border: none;
            background: transparent;
            padding: 0;
            margin: 0;
            box-shadow: none;
            outline: 0;
            cursor: pointer;
            font-weight: 400;
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
