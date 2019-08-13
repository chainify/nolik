import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { Typography, Button, Icon, Input, Divider } from 'antd';
import PageHeader from '../components/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

const { Paragraph } = Typography;


@inject('threads', 'alice', 'compose', 'cdms')
@observer
class ThreadInfo extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { threads, alice, compose, cdms } = this.props;
        const pstyle = {
            margin: 0,
            padding: 0,
        };

        return (
            <div>
                <div className="container">
                    <PageHeader
                        goBack={
                            <Button
                                type="ghost"
                                shape="circle"
                                onClick={_ => {
                                    threads.toggleShowThreadInfo();
                                }}
                                disabled={compose.addMemberOn}
                            >
                                <Icon type="close" />
                            </Button>
                        }
                    />
                    <div className="info">
                        <h2>Thread</h2>
                        <div className="paper">
                            {threads.current.cdms[threads.current.cdms.length-1].subject 
                                ? threads.current.cdms[threads.current.cdms.length-1].subject
                                : threads.current.cdms[threads.current.cdms.length-1].message.length > 140
                                    ? `${threads.current.cdms[threads.current.cdms.length-1].message.substring(0, 140)}...`
                                    : threads.current.cdms[threads.current.cdms.length-1].message}
                        </div>
                        <h2>Members</h2>
                        <div className="paper">
                            {[alice.publicKey].concat(threads.current.members).map((el, index)=> (
                                <Paragraph
                                    ellipsis
                                    style={pstyle}
                                    key={`member_${el}`}
                                >
                                    {index + 1}. {el === alice.publicKey ? <span className="self">You</span> : el}
                                </Paragraph>
                            ))}
                            {compose.toRecipients.map((el, index) => (
                                <Paragraph
                                    ellipsis
                                    style={pstyle}
                                    key={`member_${el}`}
                                >
                                    {threads.current.members.length + 2 + index}. {el}
                                </Paragraph>
                            ))}
                            {!compose.composeMode && <Divider />}
                            {!compose.composeMode && compose.addMemberOn && (
                                <Input
                                    placeholder="Public key"
                                    autoFocus
                                    value={compose.inputTo}
                                    onChange={e => {
                                        compose.inputTo = e.target.value;
                                    }}
                                    onPressEnter={e => {
                                        e.preventDefault();
                                        compose.addTag('toRecipients', compose.inputTo);
                                    }}
                                    onBlur={_ => {
                                        compose.addTag('toRecipients', compose.inputTo);
                                    }}
                                    style={{ marginBottom: '1em' }}
                                    disabled={cdms.sendCdmStatus === 'pending'}
                                />
                            )}
                            {!compose.composeMode && (
                                compose.addMemberOn ? (
                                    <div className="addMemberButtons">
                                        <div className="fwdMemo">
                                            Adding of a new member to the thread will create a new thread with a new list of members. Also all messages from current thread will be forwarded to the new thread.
                                        </div>
                                        <Button
                                            size="default"
                                            type="default"
                                            onClick={compose.toggleAddMeber}
                                            style={{marginRight: 10 }}
                                            disabled={cdms.sendCdmStatus === 'pending'}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="default"
                                            type="primary"
                                            disabled={compose.toRecipients.length === 0}
                                            onClick={cdms.fwdCdms}
                                            loading={cdms.sendCdmStatus === 'pending'}
                                        >
                                            FWD messages
                                        </Button>
                                    </div>
                                    
                                ) : (
                                    <button
                                        className="addMemberBtn"
                                        onClick={compose.toggleAddMeber}
                                        disabled={
                                            threads.current === null ||
                                            compose.composeMode
                                        }
                                    >
                                        Add member
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
                <style jsx>{`
                    .container {
                        height: 100vh;
                        background: #ddd;
                        border-left: 1px solid #e0e0e0;
                    }

                    .info {
                        padding: 1em;
                    }

                    h2 {
                        font-weight: 400;
                    }

                    .paper {
                        background: #fff;
                        padding: 1em 2em;
                        word-wrap: break-word;
                        margin-bottom: 2em;
                    }

                    .member {
                        overflow-x: hidden;
                        margin: 0;
                        font-size: 14px;
                        line-height: 18px;
                    }
                    
                    .self {
                        background: #ba68c8;
                        color: #fff;
                        padding: 0 0.4em;
                        border-radius: 4px;
                    }

                    .fwdMemo {
                        display: block;
                        font-size: 11px;
                        font-color: #999;
                        text-align: left;
                        padding-bottom: 1em;
                    }

                    .addMemberBtn {
                        border: none;
                        background: #fff;
                        padding: 0;
                        margin: 0;
                        width: 100%;
                        text-align: left;
                        box-shadow: none;
                        outline:0;
                        cursor: pointer;
                        color: #999;
                        overflow-x: hidden;
                    }

                    .addMemberBtn:hover {
                        color: #1976d2;
                    }

                    .addMemberButtons {
                        text-align: right;
                    }
                `}</style>
            </div>
        );
    }
}

ThreadInfo.propTypes = {
    // index: PropTypes.object,
};

export default ThreadInfo;