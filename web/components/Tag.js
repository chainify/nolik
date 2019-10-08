import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Button, Icon } from 'antd';

@inject('chat')
@observer
class Tag extends React.Component {
  render() {
    const { chat, type, children, index } = this.props;
    return (
      <div className="container">
        <div className="content">{children}</div>
        <div className="remove">
          <button
            type="button"
            onClick={() => {
              switch (type) {
                case 'to':
                  chat.removeTag('toRecipients', index);
                  break;
                case 'cc':
                  chat.removeTag('ccRecipients', index);
                  break;
                default:
                  break;
              }
            }}
          >
            <Icon type="close" />
          </button>
        </div>
        <style jsx>{`
          .container {
            display: inline-flex;
            background: #eee;
            border-radius: 4px;
            height: 24px;
            font-size: 14px;
            line-height: 24px;
            margin-right: 4px;
            margin-bottom: 4px;
          }

          @media only screen and (max-width: 1023px) {
            .container {
              max-width: calc(100vw - 4em - 40px);
            }
          }

          @media only screen and (min-width: 1024px) {
            .container {
              max-width: calc(1024px - 4em - 40px);
            }
          }

          .content {
            flex-grow: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 0 10px;
          }

          .remove {
            width: 24px;
            color: #999;
            text-align: center;
            padding-right: 10px;
          }

          .remove:hover {
            color: #ddd;
          }

          .remove button {
            border: none;
            background: transparent;
            padding: 0;
            margin: 0;
            text-align: center;
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

Tag.propTypes = {
  chat: PropTypes.object,
  children: PropTypes.string,
  type: PropTypes.string,
  index: PropTypes.number,
};

export default Tag;
