import React from 'react';
import { observer, inject } from 'mobx-react';
import * as moment from 'moment';
import { Icon, Typography, Button } from 'antd';
const ReactMarkdown = require('react-markdown');
const { Paragraph } = Typography;

// const MarkdownIt = require('markdown-it');
// const md = new MarkdownIt();

@inject('cdms')
@observer
class Message extends React.Component {
    render() {
        const { item } = this.props;
        const message = <ReactMarkdown
            source={item.message}
            linkTarget="_blank"
            className="messageDM"
        />;

        const pstyle = {
            margin: 0,
            padding: 0,
        };
        return (
            <div>
                <div className="message">
                    <div className="header">
                        <div className="members">
                            <div className="sender"><Paragraph ellipsis style={pstyle}>{item.logicalSender}</Paragraph></div>
                            <div className="recipient"><Paragraph ellipsis style={pstyle}>To: {item.recipient}</Paragraph></div>
                        </div>
                        <div className="info">
                            <div className="time">
                                {moment.unix(item.timestamp).format('LLLL')}
                            </div>
                            <div className="menu">
                                <Button
                                    type="ghost"
                                    shape="circle"
                                >
                                    <Icon type="ellipsis" rotate={0} />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="body">{message}</div>
                    <div className="footer"></div>
                </div>
                <style jsx>{`
                    .message {
                        width: 100%;
                        background: #fff;
                        -webkit-box-shadow: 0px 2px 5px 0px rgba(0,0,0,0.1);
                        -moz-box-shadow: 0px 2px 5px 0px rgba(0,0,0,0.1);
                        box-shadow: 0px 2px 5px 0px rgba(0,0,0,0.1);
                        margin-bottom: 2em;
                        border-radius: 4px;

                        padding: 1em 1em 1em 2em;
                        font-size: 14px;
                    }

                    .header {
                        display: flex;
                    }

                    .members {
                        flex-grow: 1;
                        overflow-x: hidden;
                        padding-right: 1em;
                    }

                    .info {
                        min-width: 140px;
                        display: flex;
                    }

                    .time {
                        flex-grow: 1;
                        font-size: 11px;
                        padding-right: 1em;
                    }

                    .menu {
                        width: 40px;
                        text-align: right;
                    }

                    .body {
                        padding-top: 2em;
                    }

                    .footer {
                        position: relative;
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