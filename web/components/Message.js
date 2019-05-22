import React from 'react';
import { observer, inject } from 'mobx-react';
import * as moment from 'moment';
import { Icon } from 'antd';
import { toJS } from 'mobx';

@inject('cdm', 'passport')
@observer
class Message extends React.Component {
    render() {
        const { item, cdm, passport } = this.props;
        return (
            <div>
                <div className={`msgRow ${item.type}`}>
                    <div className="msgBtn">
                    <div className={`message ${cdm.message && passport.id !== item.id && 'blanked2'} ${passport.id === item.id && 'selected'} ${item.type}`}>
                        <div className="body">{item.message}</div>
                        {item.type === 'incoming' && (
                            <div className="footer">
                                <div className="time">
                                    <button
                                        className="timeBtn"
                                        onClick={() => {
                                            passport.tx = null;
                                            if (passport.id === item.id) {
                                                passport.id = null;
                                            } else {
                                                passport.id = item.id;
                                            }
                                        }}
                                    >
                                        {moment.unix(item.timestamp).format('HH:mm')}
                                    </button>
                                </div>
                            </div>
                        )}
                        {item.type === 'outgoing' && (
                            <div className="footer">
                                <div className="time">
                                    <button
                                        className="timeBtn"
                                        onClick={() => {
                                            passport.tx = null;
                                            if (passport.id === item.id) {
                                                passport.id = null;
                                            } else {
                                                passport.id = item.id;
                                            }
                                        }}
                                    >
                                        {moment.unix(item.timestamp).format('HH:mm')}
                                    </button>
                                </div>
                            </div>
                        )}
                        {item.type === 'pending' && (
                            <div className="footer">
                                <div className="time">
                                    {moment.unix(item.timestamp).format('HH:mm')}
                                    <Icon type="clock-circle" style={{ fontSize: 12, marginLeft: 7 }} />
                                </div>
                            </div>
                        )}
                    </div>
                    </div>
                </div>
                <style jsx>{`
                    .msgRow {
                        width: 100%;
                        display: flex;
                    }

                    .msgRow.outgoing {
                        justify-content: flex-end;
                    }

                    .msgRow.pending {
                        justify-content: flex-end;
                    }

                    .msgBtn {
                        border: none;
                        background: transparent;
                        padding: 0;
                        margin: 0;
                        box-shadow: none;
                        outline:0;
                        max-width: 60%;
                    }

                    .message {
                        white-space: pre-wrap;
                        border-radius: 4px;
                        padding: 6px 10px;
                        margin-bottom: 4px;
                        color: #333;
                        text-align: left;
                        font-size: 1.1em;
                        font-family: 'Roboto', sans-serif;

                        // -webkit-box-shadow: 0px 1px 2px 0px rgba(51,51,51,0.2); 
                        // box-shadow: 0px 1px 2px 0px rgba(51,51,51,0.2);
                    }

                    // .blanked:not(:hover) {
                    //     background: #fafafa!important;
                    //     color: #eee!important;
                    //     box-shadow: none;
                    // }

                    // .blanked:not(:hover) a {
                    //     color: #eee!important;
                    // }

                    // .blanked:not(:hover) .time {
                    //     color: #eee!important;
                    // }

                    .message.selected {
                        margin-right: 1em;
                        margin-top: 10px;
                        margin-bottom: 18px;
                    }

                    .message.outgoing {
                        background-color: #fff;
                    }

                    // .message.outgoing:not(.blanked):hover {
                    //     background-color: #f1f8e9;
                    // }

                    .message.pending {
                        background-color: #fff;
                    }

                    .message.incoming {
                        background-color: #fff;
                    }

                    .footer {
                        font-size: 12px;
                        padding-top: 0px;
                        text-align: right;
                    }

                    .passport {
                        flex-grow: 1;
                        padding-right: 20px;
                    }

                    .passport a {
                        color: #78909c;
                    }

                    .passport a:hover {
                        color: #b0bec5;
                    }

                    .time {
                        color: #999;
                        display: inline-block;
                    }

                    .timeBtn {
                        border: none;
                        background: transparent;
                        padding: 0;
                        margin: 0;
                        box-shadow: none;
                        outline:0;
                        cursor: pointer;
                    }

                    .footer.pending {
                        text-align: right;
                    }

                    .info {
                        margin-left: 20px;
                        
                    }
                `}</style>
            </div>
        );
    }
}

Message.propTypes = {
    // index: PropTypes.object,
};

export default Message