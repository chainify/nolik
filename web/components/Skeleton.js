import React from 'react';
import { Card } from 'antd';

class Skeleton extends React.Component {
  render() {
    const titleWidth = Math.random() * (100 - 30) + 30;
    const lastRowWidth = Math.random() * (100 - 50) + 50;
    const rowsNum = this.props.rows && this.props.rows > 2 ? this.props.rows : 2;

    const rowList = [...Array(rowsNum)].map((_, index) => (
      <div key={`row_${index}`} >
        <div className={`row ${index === 0 && 'title'} ${index > 0 && index === rowsNum - 1 && 'last' }`}/>
        <style jsx>{`
          div.row {
            width: 100%;
            height: 16px;
            background-image: 
              repeating-linear-gradient(
                90deg,
                #eee,
                #fafafa
              );
            background-position: 0px 0px;
            animation: move 2s infinite;
            display: block;
            margin-bottom: 16px;
          }

          @keyframes move {
            from {
              background-position: 0px 0px;
            }
            to {
              background-position: 500px 0px;
            }
          }

          div.title {
            width: ${titleWidth}%;
          }

          div.last {
            margin-bottom: 0px;
          }
        `}</style>
      </div>
    ));

    return (
      <div>
        <div className="header">
          {rowList}
        </div>
        <style jsx>{`
          .header {
            background: none;
            padding: 20px;
          }
        `}</style>
      </div>
    );
  }
}

Skeleton.propTypes = {
  // index: PropTypes.object,
};

export default Skeleton;
