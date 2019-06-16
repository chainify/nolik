import React from 'react';
import PropTypes from 'prop-types';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { Row, Col, Input, Button, Radio } from 'antd';
const { TextArea } = Input;
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
                        {login.withWaves === null && <div className="loading">Please wait...</div>}
                        {login.withWaves === false && <div>Get Waves Keeper</div>}
                        {login.withWaves === true && (
                            <Button
                                type="primary"
                                size="large"
                                style={{ marginTop: '2em' }}
                                onClick={() => alice.auth()}
                            >
                                Unlock
                            </Button>
                        )}
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
                        font-size: 1.2em;
                        margin-bottom: 2em;
                    }

                    h3 {
                        color: #666;
                        font-weight: 100;
                        font-style: italic;
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