import React from 'react';
import { Layout, Menu, Icon } from 'antd';
import { observer, inject } from 'mobx-react';

@inject('wrapper', 'alice')
@observer
class Wrapper extends React.Component {
    render() {
        const { children, alice } = this.props;

        return (
            <div>
                <div className="wrapper">
                    <div className="sideBar">
                        <div className="item">
                            <Icon type="poweroff" onClick={alice.logOut} />
                        </div>
                    </div>
                    <div className="main">
                        {children}
                    </div>
                </div>
                <style jsx>{`
                    .wrapper {
                        height: 100vh;
                        min-width: 800px;
                        // max-width: 1000px;
                        margin-left: auto;
                        margin-right: auto;
                        display: flex;
                        flex-direction: row;
                    }

                    .sideBar {
                        min-width: 48px;
                        // flex-basis: 40px;
                        height: 100vh;
                        background: #263238;
                        padding: 10px 0;
                    }

                    .sideBar .item {
                        width: 100%;
                        height: 36px;
                        display: block;
                        color: #455a64;
                        cursor: pointer;
                        text-align: center;
                        font-size: 18px;
                        line-height: 20px;
                        padding: 8px 0;
                        font-family: 'Roboto', sans-serif;
                    }

                    .sideBar .item:hover {
                        color: #b0bec5;
                        background: #37474f;
                    }

                    .main {
                        height: 100vh;                        
                        flex-grow: 1;
                        
                    }
                `}</style>
            </div>
        );
    }
}

Wrapper.propTypes = {
    // index: PropTypes.object,
};

export default Wrapper