import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import Wrapper from './wrapper';
import ThreadInfo from './threadInfo';
import { Row, Col, Input, Button, Icon } from 'antd';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;

import Threads from './threads';
import Main from './main';

@inject('threads', 'alice')
@observer
class Index extends React.Component {
    constructor(props) {
        super(props);
        const { alice } = this.props;
        
        this.authPeriodicChecker = setInterval(() => {
            alice.authCheck();
        }, 200);
    }


    componentWillUnmount() {
        clearInterval(this.authPeriodicChecker);
    }

    render() {
        const { threads, alice } = this.props;
        return (
            <Wrapper>
                <Row>
                    <Col xs={8} lg={6}>
                        <Threads />
                    </Col>
                    <Col xs={16} lg={threads.current && threads.showThreadInfo ? 12 : 18}>
                        <Main />
                    </Col>
                    <Col xs={0} lg={threads.current && threads.showThreadInfo ? 6 : 0}>
                        {threads.current && <ThreadInfo />}
                    </Col>
                </Row>
                <style jsx>{`
                    
                `}</style>
            </Wrapper>
        );
    }
}

Index.propTypes = {
    index: PropTypes.object,
};

export default withRouter(Index)