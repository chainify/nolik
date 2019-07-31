import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { AutoComplete, Input, Button, Icon } from 'antd';
const { TextArea } = Input;

import PageHeader from '../components/PageHeader';

@inject('cdms')
@observer
class Compose extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { cdms } = this.props;
        const inputStyle = {
            border: 'none',
            background: 'transparent',
            margin: '0',
            padding: '0px',
            outline: 'none',
            boxShadow: 'none',
            fontSize: '18px',
            fontWeight: 400,
            lineHeight: '22px',
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

        return (
            <div>
                <div className="container">
                    <PageHeader
                        transparent
                        goBack={
                            <Button
                                type="ghost"
                                shape="circle"
                                onClick={cdms.toggleCompose}
                            >
                                <Icon type="close" />
                            </Button>
                        }
                        extra={[
                            <Button
                                type="primary"
                                shape="circle"
                                onClick={cdms.toggleCompose}
                                loading={false}
                            >
                                <Icon type="mail" />
                            </Button>
                        ]}
                    />
                    <div className="body">
                        <div className="formField">
                            <div className="formLabel">To:</div>
                            <div className="formInput">
                                <TextArea
                                    style={inputStyle}
                                    autoFocus
                                    autosize
                                />
                            </div>
                            <div className="formCc">
                                {!cdms.composeCcOn && (
                                    <button
                                        className="ccButton"
                                        onClick={_ => {
                                            cdms.composeCcOn = true;
                                        }}
                                    >
                                        Cc:
                                    </button>
                                )}
                            </div>
                        </div>
                        {cdms.composeCcOn && (
                            <div className="formField">
                                <div className="formLabel">Cc:</div>
                                <div className="formInput">
                                    <TextArea
                                        style={inputStyle}
                                        autosize
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
                                />
                            </div>
                        </div>
                        
                        <TextArea
                            placeholder="Message"
                            style={messageStyle}
                            autosize
                        />
                    </div>
                </div>
                <style jsx>{`
                    .container {
                        height: 100vh;
                    }
                    
                    .body {
                        height: calc(100vh - 52px);
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
                        line-height: 18px;
                        font-weight: 400;
                        color: #9e9e9e;                      
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

export default Compose;