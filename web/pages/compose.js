import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
import mouseTrap from 'react-mousetrap';

// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { AutoComplete, Input, Button, Icon, Tag } from 'antd';
const { TextArea } = Input;

import PageHeader from '../components/PageHeader';

@inject('compose', 'cdms')
@observer
class Compose extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const { compose, cdms } = this.props;        
        this.props.bindShortcut('meta+enter', () => {   
            if (
                compose.composeMode &&
                compose.message.trim() !== "" &&
                compose.toRecipients.concat(compose.ccRecipients).length > 0
            ) {
                cdms.sendCdm();
            }
        });
    }

    render() {
        const { compose, cdms } = this.props;
        const inputStyle = {
            border: 'none',
            background: 'transparent',
            margin: '0',
            padding: '0px',
            outline: 'none',
            boxShadow: 'none',
            fontSize: '18px',
            fontWeight: 400,
            lineHeight: '40px',
            height: '40px',
            resize: 'none',
            caretColor: '#2196f3',
            fontFamily: 'Roboto, sans-serif'
        };

        const messageStyle = {
            ...inputStyle,
            marginTop: 20,
            lineHeight: '24px',
        };

        const toTagStyle = {
            marginBottom: '4px',
            background: '#c8e6c9',
        }

        const ccTagStyle = {
            ...toTagStyle,
            background: '#bbdefb',
        };

        return (
            <div>
                <div className="container">
                    <PageHeader
                        transparent
                        goBack={
                            <Button
                                type="ghost"
                                shape="circle"
                                onClick={compose.toggleCompose}
                            >
                                <Icon type="close" />
                            </Button>
                        }
                        extra={[
                            <Button
                                type="primary"
                                onClick={cdms.sendCdm}
                                loading={cdms.sendCdmStatus === 'pending'}
                                disabled={
                                    compose.message === '' ||
                                    compose.toRecipients.concat(compose.ccRecipients).length === 0
                                }
                            >
                                Send
                            </Button>
                        ]}
                    />
                    <div className="body">
                        <div className="formField">
                            <div className="formLabel">To:</div>
                            <div className="formInput">
                                {compose.toRecipients.length > 0 && (
                                    <div className="inputTags">
                                        {compose.toRecipients.map((el, index) => (
                                            <Tag
                                                key={`tag_${el}`}
                                                closable
                                                style={toTagStyle}
                                                onClose={e => {
                                                    e.preventDefault();
                                                    compose.removeTag('toRecipients', index);
                                                }}
                                            >
                                                {el}
                                            </Tag>
                                        ))}
                                    </div>
                                )}
                                <Input
                                    style={inputStyle}
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
                                />
                            </div>
                            <div className="formCc">
                                {!compose.composeCcOn && (
                                    <button
                                        className="ccButton"
                                        onClick={_ => {
                                            compose.composeCcOn = true;
                                        }}
                                    >
                                        Cc:
                                    </button>
                                )}
                            </div>
                        </div>
                        {compose.composeCcOn && (
                            <div className="formField">
                                <div className="formLabel">Cc:</div>
                                <div className="formInput">
                                    {compose.ccRecipients.length > 0 && (
                                        <div className="inputTags">
                                            {compose.ccRecipients.map((el, index) => (
                                                <Tag
                                                    key={`tag_${el}`}
                                                    closable
                                                    style={ccTagStyle}
                                                    onClose={e => {
                                                        e.preventDefault();
                                                        compose.removeTag('ccRecipients', index);
                                                    }}
                                                >
                                                    {el}
                                                </Tag>
                                            ))}
                                        </div>
                                    )}
                                    <Input
                                        style={inputStyle}
                                        placeholder="Public key"
                                        value={compose.inputCc}
                                        onChange={e => {
                                            compose.inputCc = e.target.value;
                                        }}
                                        onPressEnter={e => {
                                            e.preventDefault();
                                            compose.addTag('ccRecipients', compose.inputCc);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="formField">
                            <div className="formLabel">Subject:</div>
                            <div className="formInput">
                                <TextArea
                                    style={inputStyle}
                                    autosize
                                    value={compose.subject}
                                    onChange={e => {
                                        compose.subject = e.target.value;
                                    }}
                                />
                            </div>
                        </div>
                        
                        <TextArea
                            placeholder="Message"
                            style={messageStyle}
                            autosize
                            value={compose.message}
                            className="mousetrap"
                            onChange={e => {
                                compose.message = e.target.value;
                            }}
                        />
                    </div>
                </div>
                <style jsx>{`
                    .container {
                        height: 100vh;
                        overflow-y: auto;
                    }
                    
                    .body {
                        min-height: calc(100vh - 52px);
                        padding: 4em;
                    }

                    .formField {
                        width: 100%;
                        display: flex;
                        margin-bottom: 20px;
                    }

                    .formLabel {
                        padding-right: 20px;
                        font-size: 18px;
                        line-height: 36px;
                        font-weight: 400;
                        color: #9e9e9e;                      
                    }

                    .inputTags {
                        padding: 8px 0 0px 0;
                    }

                    .formInput {
                        flex-grow: 1;
                        border-bottom: 1px solid #eee;
                    }

                    .formCc {
                        minWidth: 60px;
                        text-align: right;
                        border-bottom: 1px solid #eee;
                    }
                    
                    .ccButton {
                        margin: 0;
                        padding: 0;
                        border: none;
                        background: transparent;
                        cursor: pointer;
                        font-size: 18px;
                        line-height: 22px;
                        color: #448aff;
                        outline: none;
                        font-weight: 400;
                    }
                `}</style>
            </div>
        );
    }
}

Compose.propTypes = {
    index: PropTypes.object,
};

export default mouseTrap(Compose);