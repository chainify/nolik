import React from 'react';
import { observer, inject } from 'mobx-react';
import * as moment from 'moment';
import { Icon } from 'antd';
const ReactMarkdown = require('react-markdown');

// const MarkdownIt = require('markdown-it');
// const md = new MarkdownIt();

@inject('cdm')
@observer
class Message extends React.Component {
    render() {
        const { item } = this.props;
        const message = <ReactMarkdown
            source={item.message}
            linkTarget="_blank"
            className="messageDM"
        />;
        return (
            <div>
                <div className={`msgRow ${item.type}`}>
                    <div className={`message ${item.type}`}>
                        <div className="body">{message}</div>
                        {item.type === 'incoming' && (
                            <div className="footer">
                                <div className="time">
                                    {moment.unix(item.timestamp).format('HH:mm')}
                                </div>
                            </div>
                        )}
                        {item.type === 'outgoing' && (
                            <div className="footer">
                                <div className="time">
                                    {moment.unix(item.timestamp).format('HH:mm')}
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

                    .messageDM p {
                        margin-bottom: 0px!important;
                    }

                    .message {
                        white-space: pre-wrap;
                        border-radius: 4px;
                        padding: 6px 10px;
                        margin-bottom: 4px;
                        color: #666;
                        text-align: left;
                        font-size: 1.1em;
                        font-weight: 100;
                        font-family: 'Roboto', sans-serif;
                        max-width: 60%;
                    }

                    .message.outgoing {
                        background-color: #fff;
                    }

                    .message.pending {
                        background-color: #fff;
                        opacity: 0.5;
                    }

                    .message.incoming {
                        background-color: #fff;
                    }

                    .footer {
                        font-size: 12px;
                        padding-top: 0px;
                        text-align: right;
                    }

                    .time {
                        color: #999;
                        display: inline-block;
                    }

                    .footer.pending {
                        text-align: right;
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