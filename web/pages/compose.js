import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
import mouseTrap from 'react-mousetrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { AutoComplete, Input, Button, Icon, Tag } from 'antd';
const { TextArea } = Input;

import PageHeader from '../components/PageHeader';
import ComposeHeader from './composeHeader';

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
                                <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: 10 }} />Send
                            </Button>
                        ]}
                    />
                    <div className="body">
                        {!compose.commentIsOn && <ComposeHeader />}
                        <TextArea
                            placeholder="Message"
                            style={messageStyle}
                            autosize
                            autoFocus
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
                `}</style>
            </div>
        );
    }
}

Compose.propTypes = {
    index: PropTypes.object,
};

export default mouseTrap(Compose);