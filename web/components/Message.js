import React, {Fragment} from 'react';
import { observer, inject } from 'mobx-react';
import * as moment from 'moment';
import { Menu, Typography, Dropdown, Icon, Divider } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisV, faKey, faReply, faShare, faReplyAll, faArchive } from '@fortawesome/free-solid-svg-icons'
import { sha256 } from 'js-sha256';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { NETWORK, API_HOST } = publicRuntimeConfig;
const { Paragraph } = Typography;

import mdcss from '../styles/MarkDown.css';

const md = require('markdown-it')({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
});

@inject('cdms', 'alice', 'compose')
@observer
class Message extends React.Component {

    render() {
        const { item, cdms, alice, compose } = this.props;
        const css = `<style>${mdcss}</style>`
        const message = `${css}${md.render(item.message)}`;
        const pstyle = {
            margin: 0,
            padding: 0,
        };

        const emojiRe = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c\ude32-\ude3a]|[\ud83c\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])$/;

        const menu = (
            <Menu
                onClick={e => {
                    if (e.key === 'forward') {
                        compose.toggleForwardMessage(item);
                    }

                    if (e.key  === 'reply') {
                        compose.toggleReplyToMessage(item);
                    }

                    if (e.key  === 'replyToAll') {
                        compose.toggleReplyMessageToAll(item);
                    }

                    if (e.key === 'cdmDetails') {
                        cdms.toggleWithCrypto(item.id);
                    }
                }}
                key={`menu_${item.txId}`}
            >
                <Menu.Item key="forward">
                    <FontAwesomeIcon icon={faShare} /> Forward
                </Menu.Item>
                <Menu.Item key="reply">
                    <FontAwesomeIcon icon={faReply} /> Reply (New Thread)
                </Menu.Item>
                <Menu.Item key="replyToAll">
                    <FontAwesomeIcon icon={faReplyAll} /> Reply to All (New Thread)
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="cdmDetails">
                    <FontAwesomeIcon icon={faKey} /> CDM Details
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
                        <div className="toggleRecipietns">
                            <button
                                className="menuBtn"
                                onClick={_ => cdms.toggleWithRecipients(item.id)}
                            >
                                <Icon type={cdms.withRecipients.indexOf(item.id) > -1 ? 'down' : 'right'} />
                            </button>
                        </div>
                        <div className="members">
                            <div className="sender">
                                {item.logicalSender === alice.publicKey 
                                    ? <div className="contact self">You</div>
                                    : <Paragraph ellipsis style={pstyle}>{item.logicalSender}</Paragraph>}
                            </div>
                            <div className={`recipients ${cdms.withRecipients.indexOf(item.id) > -1 && 'active'}`}>
                                <div>
                                    <div><b>To:</b> {toRecipients.length > 0 ? toRecipients.map(el => <span className="contact" key={`contact_${el}`}>{el === alice.publicKey ? 'You' : el}</span>) : '-'}</div>
                                    <div><b>Cc:</b> {ccRecipients.length > 0 ? ccRecipients.map(el => <span className="contact" key={`contact_${el}`}>{el === alice.publicKey ? 'You' : el}</span>) : '-'}</div>
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
                    <div className={`crypto ${cdms.withCrypto.indexOf(item.id) > -1 && 'active'}`}>
                        <div className="close">
                            <button
                                className="menuBtn"
                                onClick={_ => {
                                    cdms.toggleWithCrypto(item.id);
                                }}
                            >
                                <Icon type="close" />
                            </button>
                        </div>
                        <p><b>Blockchain transaction ID:</b> <a href={`https://wavesexplorer.com/${NETWORK === 'testnet' ? 'testnet/' : ''}tx/${item.txId}`} target="_blank">{item.txId}</a></p>
                        <p><b>IPFS Hash:</b> <a href={`${API_HOST}/ipfs/${item.ipfsHash}`} target="_blank">{item.ipfsHash}</a></p>
                        <Divider />
                        <p><b>Raw subject:</b> {item.rawSubject}</p>
                        <p><b>Subject SHA256 hash:</b> {item.subjectHash}</p>
                        <p><b>Hash is valid:</b> {sha256(item.rawSubject) === item.subjectHash ? 'TRUE' : 'FALSE'}</p>
                        <Divider />
                        <p><b>Raw message:</b> {item.rawMessage}</p>
                        <p><b>Message SHA256 hash:</b> {item.messageHash}</p>
                        <p><b>Hash is valid:</b> {sha256(item.rawMessage) === item.messageHash ? 'TRUE' : 'FALSE'}</p>
                        <Divider />
                        <p><b>CDM type:</b> {item.logicalSender === item.realSender ? 'Direct (Blockchain proof)' : 'Sponsored (CDM proof)'}</p>
                        <p><b>Signed by:</b> {item.logicalSender}</p>
                        <p><b>Signature:</b> {item.signature}</p>
                    </div>
                    {item.subject && <div className={`subject ${emojiRe.test(item.subject) && 'isEmoji'}`}>{item.subject}</div>}
                    <div className="body markdown" dangerouslySetInnerHTML={{__html: message}}></div>
                </div>
                <style jsx>{`
                    .message {
                        // background: #fff;
                        // -webkit-box-shadow: 0px 2px 5px 0px rgba(0,0,0,0.1);
                        // -moz-box-shadow: 0px 2px 5px 0px rgba(0,0,0,0.1);
                        // box-shadow: 0px 2px 5px 0px rgba(0,0,0,0.1);
                        // border-radius: 4px;
                        padding: 1em 1em 0em 2em;
                        font-size: 14px;
                    }

                    .header {
                        display: flex;
                        position: relative;
                    }

                    .members {
                        flex-grow: 1;
                        overflow-x: hidden;
                        padding-right: 1em;
                        margin-bottom: 1em;
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
                        font-weight: 300;
                        margin-bottom: 0em;
                        font-size: 18px;
                        color: rgba(0, 0, 0, 1);
                    }

                    .subject.isEmoji {
                        font-size: 48px;
                    }

                    .body {
                        padding-top: 0em;
                        font-size: 14px;
                        color: rgba(0, 0, 0, 1);
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

                    .contact {
                        background: #eee;
                        margin: 0 4px 4px 0px;
                        padding: 0.2em 0.4em;
                        border-radius: 4px;
                        font-size: 12px;
                        line-height: 14px;
                        display: inline-block;
                    }

                    .contact.self {
                        background: #ba68c8;
                        color: #fff
                    }

                    .toggleRecipietns {
                        position: absolute;
                        top: 0px;
                        left: -20px;
                        color: #999;
                        font-size: 12px;
                    }

                    .sender {
                        color: #999;
                        font-size: 12px;
                    }

                    .recipients {
                        display: none;
                        font-size: 12px;
                    }

                    .recipients.active {
                        display: block;
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