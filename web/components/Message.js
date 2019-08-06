import React from 'react';
import { observer, inject } from 'mobx-react';
import * as moment from 'moment';
import { Menu, Typography, Dropdown } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisV, faKey, faReply, faShare, faReplyAll, faArchive } from '@fortawesome/free-solid-svg-icons'

const ReactMarkdown = require('react-markdown');
const { Paragraph } = Typography;

// const MarkdownIt = require('markdown-it');
// const md = new MarkdownIt();

@inject('cdms', 'alice')
@observer
class Message extends React.Component {
    render() {
        const { item, cdms, alice } = this.props;
        const message = <ReactMarkdown
            source={item.message}
            linkTarget="_blank"
            className="md"
        />;

        const pstyle = {
            margin: 0,
            padding: 0,
        };

        const menu = (
            <Menu
                onClick={e => {
                    if (e.key === 'crypto') {
                        cdms.toggleWithCrypto(item.txId);
                    }
                }}
            >
                <Menu.Item key="forward">
                    <FontAwesomeIcon icon={faShare} /> Forward
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="crypto">
                    <FontAwesomeIcon icon={faKey} /> Crypto
                </Menu.Item>

                {/* <Menu.Item key="1">
                    <FontAwesomeIcon icon={faReply} /> Reply
                </Menu.Item>
                <Menu.Item key="2">
                    <FontAwesomeIcon icon={faReplyAll} /> Reply All
                </Menu.Item> */}
                {/* <Menu.Divider />
                <Menu.Item key="3">
                    <FontAwesomeIcon icon={faArchive} /> Archive
                </Menu.Item> */}
            </Menu>
        );

        return (
            <div>
                <div className="message">
                    <div className="header">
                        <div className="members">
                            <div className="sender">
                                {item.logicalSender === alice.publicKey 
                                    ? <div className="self">You</div>
                                    : <Paragraph ellipsis style={pstyle}>{item.logicalSender}</Paragraph>}
                            </div>
                            <div className="recipient">
                                {item.recipient === alice.publicKey
                                    ? <span>To: <div className="self">You</div></span>
                                    : <Paragraph ellipsis style={pstyle}>To: {item.recipient}</Paragraph>}
                            </div>
                        </div>
                        <div className="info">
                            <div className="time">
                                {moment.unix(item.timestamp).format('LLLL')}
                            </div>
                            <div className="menu">
                                <Dropdown overlay={menu} trigger={['click']}>
                                    <button className="menuBtn ellipsis">
                                        <FontAwesomeIcon icon={faEllipsisV} />
                                    </button>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                    <div className={`crypto ${cdms.withCrypto.indexOf(item.txId) > -1 && 'active'}`}>
                        <p><b>Blockchain transaction ID:</b> <a href={`https://wavesexplorer.com/${process.env.NETWORK === 'testnet' && 'testnet/'}tx/${item.txId}`} target="_blank">{item.txId}</a></p>
                        <p><b>IPFS Hash:</b> <a href={`${process.env.API_HOST}/ipfs/${item.ipfsHash}`} target="_blank">{item.ipfsHash}</a></p>
                        <p>--</p>
                        <p><b>CDM type:</b> {item.logicalSender === item.realSender ? 'Direct (Blockchain proof)' : 'Sponsored (CDM proof)'}</p>
                        <p><b>Signed by:</b> {item.logicalSender}</p>
                        <p><b>Signature:</b> {item.signature}</p>
                    </div>
                    {item.subject && <div className="subject">{item.subject}</div>}
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
                        margin-bottom: 2em;
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
                        width: 20px;
                        text-align: right;
                    }

                    .crypto {
                        margin-bottom: 2em;
                        padding: 1em;
                        background: #eee;
                        border-radius: 4px;
                        display: none;
                        word-wrap: break-word;
                    }

                    .crypto.active {
                        display: block;
                    }

                    .crypto p {
                        margin: 0;
                    }
                    
                    .subject {
                        font-weight: 700;
                        margin-bottom: 1em;
                    }

                    .body {
                        padding-top: 0em;
                        word-wrap: break-word;
                        white-space: pre-wrap;
                    }

                    .footer {
                        position: relative;
                    }

                    .menuBtn {
                        border: none;
                        background: transparent;
                        padding: 0;
                        margin: 0;
                        box-shadow: none;
                        outline:0;
                        cursor: pointer;
                    }

                    .ellipsis {
                        text-align: center;
                        width: 20px;
                    }

                    .ellipsis:hover {
                        color: #ddd;
                    }

                    .self {
                        background: #ba68c8;
                        color: #fff;
                        padding: 0 0.4em;
                        border-radius: 4px;
                        display: inline-block;
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