import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { Input, Button, Icon, Divider, Row, Col } from 'antd';
import { keyPair } from '@waves/ts-lib-crypto';

import SendButtons from '../components/chat/SendButtons';
import CancelButtons from '../components/chat/CancelButtons';

const { TextArea } = Input;

@inject('chat')
@observer
class Chat extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const { chat, router } = this.props;
        chat.chatInit();
        chat.recipient = router.query.publicKey;
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.cdmsDiv.scrollTop = this.cdmsDiv.scrollHeight - this.cdmsDiv.clientHeight;
    }

    render() {
        const { chat } = this.props;

        return (
            <div>
                <div className="container" ref={el => { this.cdmsDiv = el; }}>
                    <div className="list">
                        {!chat.thread && (
                            <div className="empty" />
                        )}
                        {chat.thread && chat.thread.cdms.map(el => (
                            <div key={`el_${el.id}`}>
                                <p className="sender">
                                    {el.logicalSender === keyPair(chat.seed).publicKey ? 'You' : el.logicalSender}
                                </p>
                                {/* {el.subject !== '' && <p className="subject">{el.subject}</p>} */}
                                <p className="message">{el.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <style jsx>{`
                    .container {
                        height: calc(100vh - 160px - 48px - 48px - 10px - 32px - 10px - 32px - 2em);
                        overflow-y: auto;
                    }

                    .subject {
                        font-size: 18px;
                        margin: 0;
                        margin-bottom: 1em;
                    }

                    .sender {
                        font-size: 10px;
                        margin: 0;
                        coor: #999;
                    }

                    .empty {
                        height: calc(100vh - 160px - 48px - 48px - 10px - 32px - 10px - 32px - 2em);
                        width: 100%;
                        background: url(/static/empty.svg) no-repeat center center;
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