import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
import mouseTrap from 'react-mousetrap';
import * as moment from 'moment';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { AutoComplete, Input, Button, Icon, Tag } from 'antd';
const { TextArea } = Input;

import PageHeader from '../components/PageHeader';
import ComposeInputs from './composeInputs';

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
                                    compose.message.trim() === '' ||
                                    compose.toRecipients.concat(compose.ccRecipients).length === 0
                                }
                            >
                                <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: 10 }} />Send
                            </Button>
                        ]}
                    />
                    <div className="body">
                        {compose.showComposeInputs && <ComposeInputs />}
                        <div className="formField">
                            <div className="formLabel">Subject:</div>
                            <div className="formInput">
                                <TextArea
                                    style={inputStyle}
                                    autosize
                                    className="mousetrap"
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
                            autosize={{ minRows: 6 }}
                            autoFocus
                            value={compose.message}
                            className="mousetrap"
                            onChange={e => {
                                compose.message = e.target.value;
                            }}
                        />
                        {compose.cdmType === 'forwardMessage' && (
                            <div>
                                <div>{`-----Forwarded Message-----`}</div>
                                <div><b>Date:</b> {moment.unix(compose.fwdItem.timestamp).format('LLLL')}</div>
                                <div><b>Subject:</b> {compose.fwdItem.subject}</div>
                                <div>
                                    {compose.fwdItem.message}
                                </div>
                            </div>
                        )}
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

                    .formInput {
                        flex-grow: 1;
                        border-bottom: 1px solid #eee;
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