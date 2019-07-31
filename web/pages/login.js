import React from 'react';
import PropTypes from 'prop-types';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { Row, Col, Input, Button, notification, Icon, Divider } from 'antd';
import mouseTrap from 'react-mousetrap';


@inject('login', 'alice')
@observer
class Index extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const { login } = this.props;
        login.withWaves = typeof window.Waves !== 'undefined'; 
        // this.openNotification();
    }

    openNotification() {
        notification['info']({
            message: 'Nolik is currently on Testnet',
            description:
              'Every message is sent to Waves blockchain platform testnet. Test network can rollback which can affect your messages consistency. We will switch to mainnet shortly.',
        });
    }

    render() {
        const { login, alice } = this.props;
        return (
            <div className="main">
                <Row>
                    <Col xs={{ offset: 4, span: 12}}>
                        <h1>Nolik</h1>
                        <h2>
                            Instant Messenger that does not store users' data.<br />
                            No registration needed.
                        </h2>
                    </Col>
                </Row>
                <Row>
                    <Col xs={{ offset: 4, span: 10}}>
                        {login.withWaves === null && <div className="loading">Please wait...</div>}
                        {login.withWaves === true && (
                            <div>
                                <h3>
                                    Unlock Nolik with Waves Keeper.
                                    Please make sure that version 1.1.9 or above is used.
                                </h3>
                            </div>
                        )}
                        {login.withWaves === true && (
                            <Button
                                type="primary"
                                size="large"
                                style={{ marginTop: '2em' }}
                                onClick={() => alice.auth()}
                            >
                                Login with Waves Keeper
                            </Button>
                        )}
                        {login.withWaves === false && (
                            <div>
                                <h3>
                                    In order to use Nolik please install Waves Keeper browser extension
                                    and create your account. If you need help please follow
                                    the <a href="https://docs.wavesplatform.com/en/waves-client/account-management/waves-keeper.html">step-by-step guide</a>.
                                </h3>
                            </div>
                        )}
                        {login.withWaves === false && (
                            <Button
                                type="primary"
                                size="large"
                                style={{ marginTop: '2em' }}
                                href="https://wavesplatform.com/products-keeper"
                                target="_blank"
                            >
                                Get Waves Keeper
                            </Button>
                        )}
                    </Col>
                </Row>
                <Row>
                    <Col xs={{ offset: 4, span: 10}}>
                        <div style={{ paddingTop: '2em' }} />
                        <Divider />
                    </Col>
                </Row>
                <Row>
                    <Col xs={{ offset: 4, span: 10}}>
                        <Button
                            type="ghost"
                            shape="circle"
                            icon="medium"
                            size="large"
                            href="https://medium.com/@chainify.org"
                            target="_blank"
                            style={{
                                marginRight: 20,
                            }}
                        />
                        <Button
                            type="ghost"
                            shape="circle"
                            icon="github"
                            size="large"
                            href="https://github.com/chainify"
                            target="_blank"
                        />
                    </Col>
                </Row>
                
                <style jsx>{`
                    .main {
                        height: 100vh;
                        background: #fff;
                    }

                    h1 {
                        font-size: 4em;
                        font-weight: 400;
                        font-family: 'Roboto', sans-serif;
                        margin-top: 1.4em;
                        color: #666;
                    }

                    h2 {
                        font-weight: 100;
                        font-family: 'Roboto', sans-serif;
                        color: #666;
                        font-size: 2em;
                        margin-bottom: 2em;
                    }

                    div.loading {
                        color: #666;
                    }
                `}</style>
            </div>
        );
    }
}

Index.propTypes = {
    index: PropTypes.object,
};

export default withRouter(mouseTrap(Index))