import React from 'react';
import { toJS } from 'mobx';
import { observer, inject } from 'mobx-react';
import Router, { withRouter } from 'next/router';
import { Badge, Icon } from 'antd';
// import { Router as TRouter } from '../i18n';

@inject('bob', 'cdm')
@observer
class Header extends React.Component {
    render() {
        const { item, bob, cdm } = this.props;
        // console.log(toJS(item));
        return (
            <div>
                <button
                    type="button"
                    className="button"
                    onClick={() => {
                        if (bob.publicKey !== item.accounts[0].publicKey) {
                            bob.publicKey = item.accounts[0].publicKey;
                            cdm.list = item.cdm ? [item.cdm] : []
                            Router.push(`/index?publicKey=${item.accounts[0].publicKey}`, `/pk/${item.accounts[0].publicKey}`);
                        }
                    }}
                >
                    <div className={`header ${bob.publicKey === item.accounts[0].publicKey && 'active'}`}>
                        <div className="headerBody">
                            <div className="address">
                                <b>
                                    {item.accounts && item.accounts.map((el, index) => (
                                        <span key={`name_${item.index}_${index}`}>
                                            {el.name}
                                        </span>
                                    ))}
                                </b>
                            </div>
                            <div className="message">
                                {item.cdm ? item.cdm.message : 'No messages yet'}
                            </div>
                        </div>
                        <div className="badgeDiv">
                            {item.totalCdms - item.readCdms > 0 && (
                                <Badge count={item.totalCdms - item.readCdms} style={{ backgroundColor: '#64b5f6' }} />
                            )}
                            {item.totalCdms - item.readCdms < 0 && (
                                <Badge count={<Icon type="clock-circle" style={{ marginRight: 10 }} />} />
                            )}
                        </div>
                    </div>
                </button>
                <style jsx>{`
                    .button {
                        border: none;
                        background: transparent;
                        padding: 0;
                        margin: 0;
                        width: 100%;
                        text-align: left;
                        box-shadow: none;
                        outline:0;
                        cursor: pointer;
                        color: #fff;
                    }

                    .button:hover {
                        background: #ef9a9a;
                    }

                    .button * {
                        pointer-events: none;
                    }

                    .header {
                        padding: 10px 10px 10px 0px;
                        overflow-x: hidden;
                        display: flex;
                    }

                    .header.active {
                        background: #ef5350; 
                        color: #fff;
                        // border-color: #bbdefb;
                    }

                    .headerBody {
                        flex-grow: 1;
                        padding-left: 20px;
                    }

                    .badgeDiv {
                        flex-basis: 40px;
                        min-width: 40px;
                        height: 40px;
                        text-align: right;
                    }

                    .address {
                        display: -webkit-box;
                        -webkit-line-clamp: 1;
                        -webkit-box-orient: vertical;
                        width: 100%;

                        overflow: hidden;
                        white-space: no-wrap;
                        text-overflow: ellipsis;
                        word-break: break-all;
                    }

                    .message {
                        display: -webkit-box;
                        -webkit-line-clamp: 1;
                        -webkit-box-orient: vertical;

                        overflow: hidden;
                        white-space: no-wrap;
                        text-overflow: ellipsis;
                        word-break: break-all;
                        
                        width: 100%;
                        text-overflow: ellipsis;
                    }
                `}</style>
            </div>
        );
    }
}

Header.propTypes = {
    // index: PropTypes.object,
};

export default Header