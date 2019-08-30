import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { Input, Result, Button, Icon, Divider, Row, Col } from 'antd';
import { keyPair } from '@waves/ts-lib-crypto';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSnowplow} from '@fortawesome/free-solid-svg-icons'

import SendButtons from './../components/chat/SendButtons';
import CancelButtons from './../components/chat/CancelButtons';
import ChatList from './chat_list';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { NETWORK, API_HOST } = publicRuntimeConfig;

const { TextArea } = Input;

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
        const { chat } = this.props;

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

        const publicKey = chat.seed ? keyPair(chat.seed).publicKey : '';

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
                        <div>
                            <div className="title">YOUR PUBLIC KEY</div>
                            <div className="yourPublicKey">
                                <div className="publicKey">
                                    <a href={`${API_HOST}/pk/${publicKey}`} target="_blank">{publicKey}</a>
                                </div>
                                <div className="copyButton">
                                    <CancelButtons />
                                </div>
                            </div>
                            {/* <div className="title">CHAT WITH</div>
                            <div className="yourPublicKey">
                                <div className="publicKey">{chat.recipient}</div>
                                <div className="copyButton">
                                    <CancelButtons />
                                </div>
                            </div> */}
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
                                            style={inputStyle}
                                            placeholder="Message"
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
                `}</style>
            </div>
        );
    }
}

Chat.propTypes = {
    // index: PropTypes.object,
};

export default withRouter(Chat);