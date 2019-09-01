import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { Input, Result, Button, Icon, Divider, Drawer, Menu, Modal } from 'antd';
import { keyPair } from '@waves/ts-lib-crypto';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSnowplow, faSyncAlt } from '@fortawesome/free-solid-svg-icons'

import SendButtons from './../components/chat/SendButtons';
import CancelButtons from './../components/chat/CancelButtons';
import ChatList from './chat_list';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { NETWORK, API_HOST } = publicRuntimeConfig;

const { TextArea } = Input;
const { SubMenu } = Menu;

@inject('chat', 'notifiers')
@observer
class Chat extends React.Component {
    constructor(props) {
        super(props);
        const { chat } = props;

        autorun(() => {
            if (
                chat.seed && 
                chat.recipient && 
                chat.heartbeatStatus === 'init'
            ) {
                chat.heartbeat();
            }
        })

        this.heartbeatPeriodic = autorun(() => {
            if (['success', 'error'].indexOf(chat.heartbeatStatus) > -1) {
                chat.heartbeat();
            }
        })
    }

    componentDidMount() {
        const { chat, router } = this.props;
        chat.chatInit();
        chat.recipient = router.query.publicKey;
    }

    componentWillUnmount() {
        this.heartbeatPeriodic();
    }

    render() {
        const { chat, notifiers } = this.props;

        const inputStyle = {
            border: 'none',
            background: 'transparent',
            margin: 0,
            padding: '0 0px',
            outline: 'none',
            boxShadow: 'none',
            fontSize: '20px',
            lineHeight: '40px',
            height: '40px',
            resize: 'none',
            caretColor: '#2196f3',
            fontFamily: 'Roboto, sans-serif'
        }

        const infoModal = (() =>{
            Modal.info({
                centered: true,
                title: 'What is Nolik',
                content: (
                  <div>
                    <p>
                        Nolik allows to send (truly) secure messages to anyone without installing any app.
                        Check out more on <a href="https://github.com/chainify/nolik">how itworks</a>.
                    </p>
                    <p>
                        At Nolik <b>we do not store your decryption keys</b> (and we can prove it).
                        If you need to check the feedback to your messages later on or
                        have an access to the convesration follow the backup instructions.
                    </p>
                    <p>
                        <Button
                            onClick={restoreChatModal}
                        >
                            Backup chat
                        </Button>
                    </p>
                  </div>
                ),
                onOk() {},
              });
        });

        const restoreChatModal = (() =>{
            Modal.info({
                centered: true,
                title: 'How to backup your conversation',
                content: (
                  <div>
                    <ol>
                        <li>
                            Copy your seed phrase. You can do it in chat menu. 
                        </li>
                        <li>
                            Install <a href="https://wavesplatform.com/technology/keeper" target="_block">Waves Keeper</a> browser extention.
                        </li>
                        <li>
                            Create an account and import your seed phrase.
                        </li>
                        <li>Go to <a href={API_HOST} target="_blank">Nolik webpage</a> and login with Waves Keeper</li>
                    </ol>
                    <h3>IMPORTANT. Seed phrase is higly confidential information, do not disclose it to anyone!</h3>
                  </div>
                ),
                onOk() {},
              });
        });

        return (
            <div>
                <div className="container">
                    {chat.list === null && (
                        <div className="loading">
                            {chat.sendCdmStatus === 'init'
                                ? <div ><Icon type="loading" /> Generating encryption keys...</div>
                                :(
                                    <Result
                                        icon={<div className="snowplow"><FontAwesomeIcon icon={faSnowplow} /></div>}
                                        title={
                                            <div className="demolishText">
                                                The chat has been cleared by your interlocutor.
                                                At Nolik we do not store your decryption keys and your messages cannot be recovered.
                                                To start new chat please reload the page.
                                            </div>
                                        }
                                        extra={
                                        <Button
                                            type="primary"
                                            key="console"
                                            onClick={_ => {
                                                location.reload();s
                                            }}
                                        >
                                            Reload page
                                        </Button>
                                        }
                                    />
                                )}
                        </div>
                    )}
                    {chat.list && (
                        <div className="chat">
                            {chat.list.length > 0 ? (
                                <div>
                                    <div className="title">CURRENT THREAD</div>
                                    <div className="yourPublicKey">
                                        <div className="publicKey">
                                            {chat.list[0].cdms[0].subject}
                                        </div>
                                        <div className="copyButton">
                                            <Button
                                                onClick={chat.toggleShowDrawer}
                                            >
                                                <Icon type="menu" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="title">ONE-TIME CHAT WITH</div>
                                    <div className="yourPublicKey">
                                        <div className="publicKey">
                                            {chat.recipient}
                                        </div>
                                        <div className="copyButton">
                                            <Button
                                                onClick={chat.toggleShowDrawer}
                                            >
                                                <Icon type="menu" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <Divider />
                                <ChatList />
                                <Divider />
                            </div>  
                            <div className="form">
                                <div className="inputs">
                                    <div className="message">
                                        <TextArea
                                            autosize={{ minRows: 4 }}
                                            autoFocus
                                            style={inputStyle}
                                            placeholder="Write your message here"
                                            value={chat.message}
                                            onChange={e => {
                                                chat.message = e.target.value;
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="sendButton">
                                    <SendButtons />
                                </div>
                            </div>
                            <Drawer
                                title="Nolik messenger"
                                placement="right"
                                closable
                                onClose={chat.toggleShowDrawer}
                                visible={chat.showDrawer}
                            >
                                 <Menu
                                    mode="inline"
                                    inlineIndent={0}
                                    defaultOpenKeys={chat.thread ? ['threads'] : null}
                                    style={{
                                        borderRight: 0,
                                    }}
                                 >
                                     <SubMenu
                                        key="threads"
                                        disabled={!chat.thread}
                                        title={
                                            <span>
                                                <Icon type="message" />
                                                <span>Threads</span>
                                            </span>
                                        }
                                    >
                                        {chat.list && chat.list.map(el => (
                                            <Menu.Item
                                                key={`subject_${el.threadHash}`}
                                                onClick={_ => {
                                                    chat.setThread(el);
                                                    chat.toggleShowDrawer();
                                                }}
                                            >
                                                <span className="subMenu">{el.cdms[0].subject}</span>
                                            </Menu.Item>
                                        ))}
                                    </SubMenu>
                                    <Menu.Item disabled><Divider /></Menu.Item>
                                    <Menu.Item
                                        key={'copyChatUrl'}
                                        onClick={chat.copyChatUrl}
                                    >
                                        <Icon type="share-alt" /> Share your one-time link
                                    </Menu.Item>
                                    <Menu.Item
                                        key={'copySeedPhrase'}
                                        onClick={chat.copySeedPhrase}
                                    >
                                        <Icon type="copy" /> Copy seed phrase
                                    </Menu.Item>
                                    <Menu.Item
                                        key={'whatIsNolik'}
                                        onClick={infoModal}
                                    >
                                       <Icon type="info-circle" /> What is Nolik
                                    </Menu.Item>
                                    <Menu.Item disabled><Divider /></Menu.Item>
                                    <Menu.Item
                                        onClick={_ => {
                                            chat.selfClearChat();
                                        }}
                                    >
                                        <div className="dropChat">
                                            <Icon type="reload" /> Reset account
                                        </div>
                                    </Menu.Item>
                                </Menu>
                            </Drawer>
                        </div>
                    )}
                </div>
                <style jsx>{`
                    .container {
                        height: 100vh;
                        max-width: 700px;
                        margin-left: auto;
                        margin-right: auto;
                        padding: 1em;
                        display: flex;
                    }

                    .chat {
                        width: 100%;
                    }

                    .loading {
                        align-self: center;
                        text-align: center;
                    }

                    .yourPublicKey {
                        width: 100%;
                        display: flex;
                    }

                    .title {
                        line-height: 10px;
                        font-size: 10px;
                        color: #999;
                    }

                    .yourPublicKey .publicKey {
                        flex-grow: 1;
                        line-height: 32px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        padding-right: 20px;
                    }

                    .yourPublicKey .copyButton {
                        flex-basis: 40px;
                    }

                    .form {
                        width: 100%;
                        display: flex;
                    }

                    .form .inputs {
                        flex-grow: 1;
                    }

                    .subject {
                        margin-top: 2em;
                        margin-bottom: 2em;
                    }

                    .form .sendButton {
                        flex-basis: 40px;
                        text-align: right;
                        padding-left: 20px;
                    }

                    .snowplow {
                        font-size: 48px;
                    }

                    .demolishText {
                        margin: 2em;
                        font-size: 16px;
                    }

                    .nolikDescr {
                        font-size: 12px;
                        color: #999;
                    }

                    .dropChat {
                        color: red;
                    }
                    
                    .subMenu {
                        padding-left: 24px;
                    }
                `}</style>
            </div>
        );
    }
}

Chat.propTypes = {
    // index: PropTypes.object,
};

export default withRouter(Chat);