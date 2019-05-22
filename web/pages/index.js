import React from 'react';
import PropTypes from 'prop-types';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import Wrapper from '../components/Wrapper';
import Header from '../components/Header';
import Cdm from '../components/Cdm';
import Skeleton from '../components/Skeleton';
import { Row, Col, Input, Divider, Icon } from 'antd';
const { TextArea } = Input;
import * as moment from 'moment';
import mouseTrap from 'react-mousetrap';


@inject('alice', 'bob', 'index', 'cdm', 'passport')
@observer
class Index extends React.Component {

    authPeriodicChecker = null;
    contactsPeriodicChecker = null;
    constructor(props) {
        super(props);
        
        const { alice, bob, router, cdm, passport } = this.props;
        
        this.authPeriodicChecker = setInterval(() => {
            alice.authCheck();
        }, 200);
        
        autorun(() => {
            if (router.query.publicKey) {
                sessionStorage.setItem('bobPublicKey', router.query.publicKey);
                bob.publicKey = router.query.publicKey;
            }
        });

        autorun(() => {
            if (alice.publicKey) {
                bob.initLevelDB();
                bob.getList();
            }
        });
        
        this.contactsPeriodicChecker = autorun(() => {
            if (bob.getListStatus === 'success') {
                console.log('get bob list');
                bob.getList();
            }
        });

        autorun(() => {
            if (alice.publicKey && bob.publicKey) {
                cdm.initLevelDB(alice.publicKey, bob.publicKey);
                cdm.getList();
            }
        });
        
        autorun(() => {
            if (passport.id) {
                passport.getPassport();
            }
        });
    }

    componentDidMount() {
        const { cdm } = this.props;
        this.props.bindShortcut('meta+enter', () => {
            if (cdm.message.trim() !== "") {
                cdm.sendCdm();
            }
        });
    }

    componentWillUnmount() {
        this.contactsPeriodicChecker();
        clearInterval(this.authPeriodicChecker);
    }

    render() {
        const { bob, cdm, index, passport } = this.props;
        
        return (
            <Wrapper>
                <Row>
                    <Col xs={8} lg={6}>
                        <div className="contacts">
                            {!bob.list && index.fakeHeaders.map(item => (
                                <Skeleton rows={2} key={`header_${item}`} />
                            ))}
                            {bob.list && bob.list.length === 0 && !bob.newBob && (
                                <div className="noContacts">No conversations</div>
                            )}
                            {bob.newBob && (
                                <Header item={bob.newBob} key={`header_${bob.newBob.index}`} />
                            )}
                            {bob.list && bob.list.map(item => (
                                <Header item={item} key={`header_${item.index}`} />
                            ))}
                        </div>
                    </Col>
                    <Col xs={16} lg={passport.id === null ? 18: 12}>
                        {bob.publicKey === null && <div className={`cdm empty`} />}
                        {bob.publicKey && bob.list && (
                            <div className="cdm">
                                <Cdm />
                                <div className="actions">
                                    {/* <div className={`actionButtons ${!cdm.message && 'hidden'}`}>
                                        <button
                                            className="actionButton"
                                            disabled={cdm.sendCdmStatus === 'pending'}
                                            onClick={() => {
                                                cdm.sendCdm();
                                            }}
                                        >   
                                            {cdm.sendCdmStatus === 'pending' ? <Icon type="loading" style={{ fontSize: 24 }} /> : <div className="paperPlane" />}
                                        </button>
                                    </div> */}
                                    <TextArea
                                        value={cdm.message}
                                        ref={elem => this.tArea = elem}
                                        autosize={{ "minRows" : 2, "maxRows" : 20 }}
                                        placeholder={`Type your message here. ⌘ + Enter to send message`}
                                        onChange={e => {
                                            cdm.message = e.target.value;
                                        }}
                                        className="mousetrap"
                                        style={{
                                            border: 'none',
                                            background: 'none',
                                            margin: 0,
                                            padding: 0,
                                            outline: 'none',
                                            boxShadow: 'none',
                                            color: '#fff',
                                            fontSize: '1.2em'
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </Col>
                    <Col xs={0} lg={passport.id === null ? 0 : 6}>
                        <div className="passport">
                            <div className="passportHeader">
                                <button
                                    onClick={() => {
                                        passport.id = null;
                                    }}
                                >
                                    <Icon type="close" />
                                </button>
                            </div>
                            <div className="passportContent">
                                <h2>Chainify passport</h2>
                                {passport.tx ? (
                                    <div className="content">
                                        <h3>The encrypted message, stored on IPFS network</h3>
                                        <h4><a href={`/ipfs/${passport.tx.ipfsHash}`} target="_blank">{passport.tx.ipfsHash}</a></h4>

                                        <h3>Saved to Waves blockchain platform with transaction</h3>
                                        <h4><a href={`https://wavesexplorer.com/testnet/tx/${passport.tx.id}`} target="_blank">{passport.tx.id}</a></h4>

                                        <h3>Unique Chainify Passport ID</h3>
                                        <h4>{passport.id}</h4>
                                        
                                        <h3>The sender of a message</h3>
                                        <h4><b>{passport.tx.senderName}</b> {`<`}<a href={`https://wavesexplorer.com/testnet/address/${passport.tx.sender}`} target="_blank">{passport.tx.sender}</a>{`>`}</h4>

                                        <h3>The recipient of a message</h3>
                                        <h4><b>{passport.tx.recipientName}</b> {`<`}<a href={`https://wavesexplorer.com/testnet/address/${passport.tx.recipient}`} target="_blank">{passport.tx.recipient}</a>{`>`}</h4>

                                        <h3>The message was sent on</h3>
                                        <h4>{moment.unix(passport.tx.timestamp).format('MMM DD YYYY, HH:mm')}</h4>
                                        <Divider />
                                        <p><a href={`/passport/${passport.id}`} target="_blank">Share</a></p>
                                    </div>
                                ) : (
                                    <div>Loading...</div>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
                <style jsx>{`
                    .contacts {
                        height: 100vh;
                        overflow-y: auto;
                        background: #42a5f5;
                        // border-right: 1px solid #ddd;
                    }

                    .contacts .noContacts {
                        line-height: 50px;
                        text-align: center;
                    }

                    .cdm {
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }

                    .cdm.empty {
                        height: 100vh;
                        background: url(./../static/empty.svg) no-repeat center center;
                        background-size: 20%;
                    }

                    .cdm .actions {
                        background: #2196f3;
                        // border-top: 1px solid #ddd;
                        padding: 20px;
                        position: relative
                    }

                    .actionButtons {
                        position: absolute;
                        top: -50px;
                        right: 30px;
                    }

                    .actionButtons.hidden {
                        display: none;
                    }

                    .actionButton {
                        height: 40px;
                        width: 40px;
                        border: 0px;
                        cursor: pointer;
                        background: #1e88e5;
                        border-radius: 50%;
                        border: 2px solid #fff;
                    }

                    .actionButton[disabled] {
                        cursor: default;
                        background: #90caf9;
                        color: #fff;
                    }

                    .actionButton:hover:not[disabled] {
                        background: #42a5f5;
                    }

                    .paperPlane {
                        height: 20px;
                        width: 20px;
                        background: url(./../static/paper-plane-solid-fff.png) no-repeat center center;
                        background-size: cover;
                    }

                    .passport {
                        height: 100vh;
                        background: #fff;
                        border-left: 1px solid #ddd;
                    }

                    .passportHeader {
                        height: 50px;
                        text-align: right;
                    }

                    .passportHeader button {
                        height: 100%;
                        width: 50px;
                        border: none;
                        padding: 0;
                        margin: 0;
                        box-shadow: none;
                        outline:0;
                        cursor: pointer;
                    }

                    .passportContent {
                        padding: 20px;
                    }

                    .passportContent h2 {
                        font-size: 1.6em;
                        font-weight: 100;
                        margin-top: 0px;
                        font-family: 'Roboto', sans-serif;
                    }

                    .passportContent h3 {
                        font-size: 1em;
                        font-weight: 100;
                        margin-bottom: 0;
                        color: #999;
                        font-family: 'Roboto', sans-serif;
                    }

                    .passportContent h4 {
                        font-size: 1em;
                        font-weight: 100;
                        font-family: 'Roboto', sans-serif;
                        margin-bottom: 1.4em;

                        display: -webkit-box;
                        -webkit-line-clamp: 1;
                        -webkit-box-orient: vertical;
                        width: 100%;
                        text-overflow: ellipsis;
                        overflow-y: hidden;
                        word-break: break-all;
                    }
                `}</style>
            </Wrapper>
        );
    }
}

Index.propTypes = {
    index: PropTypes.object,
};

export default withRouter(mouseTrap(Index))