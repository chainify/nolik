import React from 'react';
import { Layout, Menu, Icon } from 'antd';
import { observer, inject } from 'mobx-react';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;

@inject('wrapper', 'alice', 'notifiers')
@observer
class Wrapper extends React.Component {
    render() {
        const { children, notifiers, alice } = this.props;

        return (
            <div>
                <div className="wrapper">
                    <div className="sideBar">
                        <button
                            className="item add"
                            onClick={_ => {
                                notifiers.info('Not available yet');
                            }}
                        >
                            <Icon type="plus-circle" />
                        </button>
                        <button className="item active">
                            CNFY
                        </button>
                    </div>
                    <div className="main">
                        {children}
                    </div>
                    
                </div>
                <div className="footer">
                    Your public link: <a  href={`${API_HOST}/pk/${alice.publicKey}`} target="_blank">{`${API_HOST}/pk/${alice.publicKey}`}</a>
                </div>
                <style jsx>{`
                    .wrapper {
                        height: calc(100vh - 32px);
                        min-width: 800px;
                        margin-left: auto;
                        margin-right: auto;
                        display: flex;
                        flex-direction: row;
                    }

                    .sideBar {
                        min-width: 48px;
                        height: calc(100vh - 32px);
                        background: #263238;
                        padding: 10px 0;
                    }

                    .sideBar .item {
                        width: 100%;
                        height: 36px;
                        display: block;
                        color: #455a64;
                        text-align: center;
                        font-size: 14px;
                        line-height: 20px;
                        padding: 8px 0;
                        font-family: 'Roboto', sans-serif;

                        border: none;
                        background: transparent;
                        margin: 0;
                        box-shadow: none;
                        outline:0;
                        cursor: pointer;
                    }

                    .sideBar .item.add {
                        font-size: 20px;
                    }

                    .sideBar .item.active {
                        color: #b0bec5;
                        background: #37474f;
                    }

                    .sideBar .item:hover {
                        color: #b0bec5;
                        background: #37474f;
                    }

                    .main {                    
                        flex-grow: 1;
                        height: calc(100vh - 32px);
                    }

                    .footer {
                        display: block;
                        height: 30px;
                        line-height: 30px;
                        padding: 0 2em;
                        background: #eee;
                        border-top: 1px solid #ddd;
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