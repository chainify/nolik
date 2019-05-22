import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import Router, { withRouter } from 'next/router';
import * as moment from 'moment';

import { i18n, Link, withNamespaces } from '../i18n';
import { Row, Col, Divider } from 'antd';
import { autorun } from 'mobx';


@inject('passport')
@observer
class Passport extends React.Component {
    // static async getInitialProps() {
    //     return {
    //         namespacesRequired: ['common'],
    //     }
    // }

    constructor(props) {
        super(props);

        const { passport, router } = props;
        autorun(() => {
            if (router.query.id) {
                passport.id = router.query.id;
            }
        })
    }

    componentDidMount() {
        const { passport } = this.props;
        passport.getPassport();
    }

    render() {
        const { t, passport } = this.props;

        return (
            <div>
                <Row>
                    <Col
                        xs={{ span: 22, offset: 1}}
                        sm={{ span: 20, offset: 2}}
                        md={{ span: 16, offset: 4}}
                        lg={{ span: 14, offset: 5}}
                        xl={{ span: 12, offset: 6}}
                    >
                        <h1>Chainify passport</h1>
                        {passport.tx ? (
                            <div className="content">
                                <h2>The encrypted message, stored on IPFS network</h2>
                                <h3><a href={`/ipfs/${passport.tx.ipfsHash}`} target="_blank">{passport.tx.ipfsHash}</a></h3>

                                <h2>Saved to Waves blockchain platform with transaction</h2>
                                <h3><a href={`https://wavesexplorer.com/testnet/tx/${passport.tx.id}`} target="_blank">{passport.tx.id}</a></h3>

                                <h2>Unique Chainify Passport ID</h2>
                                <h3>{passport.id}</h3>
                                
                                <h2>The sender of a message</h2>
                                <h3><b>{passport.tx.senderName}</b> {`<`}<a href={`https://wavesexplorer.com/testnet/address/${passport.tx.sender}`} target="_blank">{passport.tx.sender}</a>{`>`}</h3>

                                <h2>The recipient of a message</h2>
                                <h3><b>{passport.tx.recipientName}</b> {`<`}<a href={`https://wavesexplorer.com/testnet/address/${passport.tx.recipient}`} target="_blank">{passport.tx.recipient}</a>{`>`}</h3>

                                <h2>The message was sent on</h2>
                                <h3>{moment.unix(passport.tx.timestamp).format('MMM DD YYYY, HH:mm')}</h3>
                                <Divider />
                                <p><a href="https://chainify.org">chainify.org</a></p>
                                <p>Telegram group: <a href="https://t.me/chainify_talks" target="_blank">@chainify_talks</a></p>
                                <p>Telegram channel: <a href="https://t.me/chainify" target="_blank">@chainify</a></p>
                            </div>
                        ) : (
                            <div>Loading...</div>
                        )}
                    </Col>
                </Row>
                <style jsx>{`
                    h1 {
                        margin-top: 60px;
                        margin-bottom: 60px;
                        font-size: 4em;
                        font-weight: 100;
                        font-family: 'Roboto', sans-serif;
                    }

                    h2 {
                        font-size: 1em;
                        font-weight: 300;
                        color: #999;
                        font-family: 'Roboto', sans-serif;
                        margin-bottom: 0;
                    }

                    h3 {
                        font-size: 1.4em;
                        font-weight: 300;
                        font-family: 'Roboto', sans-serif;
                        margin-top: 0;
                        margin-bottom: 32px;

                        display: -webkit-box;
                        -webkit-line-clamp: 1;
                        -webkit-box-orient: vertical;
                        width: 100%;
                        text-overflow: ellipsis;
                        overflow-y: hidden;
                        word-break: break-all;
                    }

                    .content {
                        padding-bottom: 4em;
                    }
                `}</style>
            </div>
        );
    }
}

Passport.propTypes = {
    passport: PropTypes.object,
};

export default withNamespaces('common')(withRouter((Passport)))