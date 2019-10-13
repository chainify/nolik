import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Badge, Icon, Typography } from 'antd';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faLevelDownAlt, faLevelUpAlt, faBookmark } from '@fortawesome/free-solid-svg-icons';
const striptags = require('striptags');

const { Paragraph } = Typography;
const md = require('markdown-it')({
  html: false,
  linkify: false,
  typographer: false,
});

@inject('threads')
@observer
class Thread extends React.Component {
  render() {
    const { item, threads } = this.props;
    const paragrapStyle = {
      margin: 0,
      padding: 0,
      color: '#999',
    };

    return (
      <div>
        <button
          type="button"
          className="button"
          onClick={() => {
            if (
              threads.current === null ||
              (threads.current &&
                threads.current.threadHash !== item.threadHash)
            ) {
              threads.setThread(item);
            }
          }}
        >
          <div
            className={`header ${threads.current &&
              threads.current.threadHash === item.threadHash &&
              'active'}`}
          >
            <div className="headerBody">
              <div className="users">
                {item.members.length > 1 && <Icon type="team" />}
              </div>
              <div>
                {item.cdms[0].subject && (
                  <Paragraph ellipsis style={paragrapStyle}>
                    <span className="headerTitle">{item.cdms[0].subject}</span>
                  </Paragraph>
                )}
                <Paragraph ellipsis style={paragrapStyle}>
                  <span className="headerMessage">
                    {striptags(
                      md.render(item.cdms[item.cdms.length - 1].message),
                    )}
                  </span>
                </Paragraph>
              </div>
            </div>
            <div className="badgeDiv">
              {item.totalCdms - item.readCdms > 0 && (
                <Badge count={item.totalCdms - item.readCdms} />
              )}
              {item.totalCdms - item.readCdms < 0 && (
                <Badge
                  count={
                    <Icon type="clock-circle" style={{ marginRight: 10 }} />
                  }
                />
              )}
            </div>
          </div>
        </button>
        <style jsx>{`
          .button {
            border: none;
            background: #fff;
            padding: 0;
            margin: 0;
            width: 100%;
            text-align: left;
            box-shadow: none;
            outline: 0;
            cursor: pointer;
            color: #999;
            overflow-x: hidden;
          }

          .button:hover {
            background: #fafafa;
          }

          .button * {
            pointer-events: none;
          }

          .header {
            padding: 10px 10px 10px 0px;
            display: flex;
            max-width: 600px;
          }

          .header.active {
            background: #eee;
          }

          .headerBody {
            flex-grow: 1;
            padding-left: 40px;
            overflow-x: hidden;
            position: relative;
          }

          .users {
            position: absolute;
            top: 0px;
            left: 16px;
          }
          .headerTitle {
            color: #333;
          }

          .headerMessage {
            // white-space: nowrap;
            // overflow: hidden;
            // text-overflow: ellipsis;
          }

          .badgeDiv {
            flex-basis: 40px;
            min-width: 40px;
            height: 40px;
            text-align: right;
          }
        `}</style>
      </div>
    );
  }
}

Thread.propTypes = {
  item: PropTypes.object,
  threads: PropTypes.object,
};

export default Thread;
