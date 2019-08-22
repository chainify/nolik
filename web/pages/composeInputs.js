import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import mouseTrap from 'react-mousetrap';

import { Input, Tag } from 'antd';
const { TextArea } = Input;


@inject('compose')
@observer
class ComposeHeader extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { compose } = this.props;
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
                            onBlur={_ => {
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
                                onBlur={_ => {
                                    compose.addTag('ccRecipients', compose.inputCc);
                                }}
                            />
                        </div>
                    </div>
                )}
                
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

ComposeHeader.propTypes = {
    index: PropTypes.object,
};

export default mouseTrap(ComposeHeader);