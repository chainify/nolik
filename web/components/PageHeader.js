import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Typography } from 'antd';
const { Paragraph } = Typography;

// @inject('cdms')
@observer
class PageHeader extends React.Component {
  render() {
    const { goBack, title, extra, transparent } = this.props;
    return (
      <div>
        <div className={`container ${transparent && 'transparent'}`}>
          {goBack && <div className="goBack">{goBack}</div>}
          {title && <div className="title">{title}</div>}
          {extra && (
            <div className="extra">
              {extra.map((el, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={`extra_item_${index}`} className="extraItem">
                  {el}
                </div>
              ))}
            </div>
          )}
        </div>
        <style jsx>{`
          .container {
            height: 52px;
            padding: 10px 10px;
            background: #f5f5f5;
            display: flex;
            border-bottom: 1px solid #e0e0e0;
          }

          .container.transparent {
            background-color: transparent;
            border-bottom: none;
          }

          .goBack {
            min-width: 40px;
            text-align: left;
          }

          .title {
            flex-grow: 1;
            text-align: left;
            font-size: 18px;
            line-height: 32px;
            font-family: 'Roboto', sans-serif;
            font-weight: 400;
            padding-right: 20px;
            color: #616161;

            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .extra {
            flex-grow: 1;
            text-align: right;
            display: flex;
          }

          .extraItem {
            margin-right: 10px;
            text-align: right;
          }

          .extraItem:first-child {
            flex-grow: 1;
          }

          .extraItem:last-child {
            margin-right: 0;
          }
        `}</style>
      </div>
    );
  }
}

PageHeader.propTypes = {
  goBack: PropTypes.object,
  title: PropTypes.string,
  extra: PropTypes.array,
  transparent: PropTypes.bool,
  // index: PropTypes.object,
};

export default PageHeader;
