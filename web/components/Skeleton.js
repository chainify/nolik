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
                background: #f2f2f2;
                display: block;
                margin-bottom: 16px;
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
                background: #42a5f5;
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

export default Skeleton