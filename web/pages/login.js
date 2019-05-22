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
import { Row, Col, Input, Divider, Icon, Button } from 'antd';
const { TextArea } = Input;
import * as moment from 'moment';
import mouseTrap from 'react-mousetrap';


@inject('alice', 'bob', 'index', 'cdm', 'passport')
@observer
class Index extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        
    }

    componentWillUnmount() {

    }


    render() {
        const { alice } = this.props;
        return (
            <div className="main">
                <Row>
                    <Col xs={{ offset: 4, span: 16}} >
                        <h1>Login required</h1>
                        <h2>Please unlock application with Waves Keeper</h2>
                    </Col>
                </Row>
                <Row>
                    <Col xs={{ offset: 4, span: 16}} >
                        <Button
                            type="ghost"
                            size="large"
                            style={{ color: '#fff' }}
                            onClick={() => {
                                alice.auth();
                            }}
                        >
                            Unlock
                        </Button>
                    </Col>
                </Row>
                <style jsx>{`
                    .main {
                        height: 100vh;
                        background: #2196f3;
                    }

                    h1 {
                        font-size: 6em;
                        font-weight: 400;
                        font-family: 'Roboto', sans-serif;
                        margin-top: 2em;
                        color: #fff;

                    }

                    h2 {
                        font-weight: 100;
                        font-family: 'Roboto', sans-serif;
                        color: #fff;
                        font-size: 1.8em;
                        margin-bottom: 2em;
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