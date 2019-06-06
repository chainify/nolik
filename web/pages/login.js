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
import { Row, Col, Input, Divider, Icon, Button, Radio } from 'antd';
const { TextArea } = Input;
import * as moment from 'moment';
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
    }

    render() {
        const { login, alice } = this.props;
        const radioStyle = {
            color: '#fff',
            display: 'block',
            fontSize: '1.2em',
            
            marginBottom: 10,
        }
        return (
            <div className="main">
                <Row>
                    <Col xs={{ offset: 4, span: 16}}>
                        <h1>Login required</h1>
                        
                    </Col>
                </Row>
                <Row>
                    <Col xs={{ offset: 4, span: 16}}>
                        {login.withWaves === null ? (
                            <div className="loading">Please wait...</div>
                        ) : (
                            <Radio.Group
                                size="large"
                                value={login.loginWith}
                                onChange={e => {
                                    login.loginWith = e.target.value;
                                }}
                            >
                                <Radio style={radioStyle} value="keeper" disabled={!login.withWaves}>Unlock with Waves Keeper</Radio>
                                <Radio style={radioStyle} value="seed">Unlock with Seed phrase</Radio>
                            </Radio.Group>
                        )}
                    </Col>
                </Row>
                {login.loginWith === 'seed' && (
                    <Row>
                        <Col xs={{ offset: 4, span: 16}}>
                            {login.withWaves === true && (<h3>This method is not recomended</h3>)}
                            <TextArea
                                style={{
                                    color: '#fff',
                                    border: '1px solid #fff',
                                    padding: 20,
                                    background: 'transparent',
                                }}
                                value={login.seed}
                                onChange={e => {
                                    login.seed = e.target.value;
                                }}
                            />
                        </Col>
                    </Row>
                )}
                <Row>
                    <Col xs={{ offset: 4, span: 16}} >
                        {login.loginWith && (
                            <Button
                                type="ghost"
                                size="large"
                                style={{ color: '#fff', marginTop: '2em' }}
                                onClick={() => {
                                    if (login.loginWith === 'keeper') {
                                        alice.auth();
                                    } else {
                                        alice.init();
                                    }
                                }}
                                disabled={
                                    (login.loginWith === 'seed' && login.seed === '') ||
                                    login.loginWith === null
                                }
                            >
                                Unlock
                            </Button>
                        )}
                    </Col>
                </Row>
                
                <style jsx>{`
                    .main {
                        height: 100vh;
                        background: #2196f3;
                    }

                    h1 {
                        font-size: 4em;
                        font-weight: 400;
                        font-family: 'Roboto', sans-serif;
                        margin-top: 1.4em;
                        color: #fff;
                    }

                    h2 {
                        font-weight: 100;
                        font-family: 'Roboto', sans-serif;
                        color: #fff;
                        font-size: 1.2em;
                        margin-bottom: 2em;
                    }

                    h3 {
                        color: #fff;
                        font-weight: 100;
                        font-style: italic;
                    }

                    div.loading {
                        color: #fff;
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