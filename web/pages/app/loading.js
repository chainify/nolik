import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { Icon } from 'antd';

@observer
class Loading extends React.Component {
  render() {
    return (
      <div>
        <div className="main">
          <div className="content">
            <Icon type="loading" /> Loading...
          </div>
        </div>
        <style jsx>{`
          .main {
            height: 100vh;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
            display: flex;
          }

          .content {
            width: 100%;
            align-self: center;
            text-align: center;
          }

          h1 {
            font-size: 1em;
            margin: 0;
            font-family: 'Muli', sans-serif;
            color: #333;
          }
        `}</style>
      </div>
    );
  }
}

Loading.propTypes = {};

export default Loading;
