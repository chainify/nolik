import React from 'react';
import { observer, inject } from 'mobx-react';
import * as moment from 'moment';
import { Menu, Typography, Dropdown, Icon } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisV, faKey, faReply, faShare, faReplyAll, faArchive } from '@fortawesome/free-solid-svg-icons'
import { sha256 } from 'js-sha256';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { NETWORK, API_HOST } = publicRuntimeConfig;

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
                <Menu.Item key="forward" disabled>
                    <FontAwesomeIcon icon={faShare} /> Forward
                </Menu.Item>
                <Menu.Item key="forward" disabled>
                    <FontAwesomeIcon icon={faReply} /> Reply
                </Menu.Item>
                <Menu.Item key="forward" disabled>
                    <FontAwesomeIcon icon={faReplyAll} /> Reply All
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="crypto">
                    <FontAwesomeIcon icon={faKey} /> Crypto
                </Menu.Item>
            </Menu>
        );

        const toRecipients = item.sharedWith
            .filter(el => el.txId === item.txId)
            .filter(el => el.type === 'to')
            .map(el => el.publicKey);
        const ccRecipients = item.sharedWith
            .filter(el => el.txId === item.txId)
            .filter(el => el.type === 'cc')
            .map(el => el.publicKey)
            {/* </span><div className="self">You</div> */}

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
                                <div>
                                    {toRecipients.length > 0 && <Paragraph ellipsis={{ rows: 1, expandable: true }} style={pstyle}>To: {toRecipients.join(', ')}</Paragraph>}
                                    {ccRecipients.length > 0 && <Paragraph ellipsis={{ rows: 1, expandable: true }} style={pstyle}>Cc: {ccRecipients.join(', ')}</Paragraph>}
                                </div>
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
                        <div className="close">
                            <button
                                className="menuBtn"
                                onClick={_ => {
                                    cdms.toggleWithCrypto(item.txId);
                                }}
                            >
                                <Icon type="close" />
                            </button>
                        </div>
                        <p><b>Blockchain transaction ID:</b> <a href={`https://wavesexplorer.com/${NETWORK === 'testnet' ? 'testnet/' : ''}tx/${item.txId}`} target="_blank">{item.txId}</a></p>
                        <p><b>IPFS Hash:</b> <a href={`${API_HOST}/ipfs/${item.ipfsHash}`} target="_blank">{item.ipfsHash}</a></p>
                        <p>--</p>
                        <p><b>Raw message:</b> {item.rawMessage}</p>
                        <p><b>Message SHA256 hash:</b> {item.messageHash}</p>
                        <p><b>Hash is valid:</b> {sha256(item.rawMessage) === item.messageHash ? 'TRUE' : 'FALSE'}</p>
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
                        background: #f5f5f5;
                        border-radius: 4px;
                        display: none;
                        word-wrap: break-word;
                        position: relative;
                    }

                    .crypto .close {
                        width: 20px;
                        height: 20px;
                        position: absolute;
                        right: 10px;
                        top: 10px;
                        text-align: center;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 18px;
                        line-height: 18px;
                    }

                    .crypto .close:hover {
                        color: #ccc;
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