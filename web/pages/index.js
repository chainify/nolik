import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import Wrapper from './wrapper';
import GroupInfo from './groupInfo';
import { Row, Col, Input, Button, Icon } from 'antd';

import Groups from './groups';
import Main from './main';

@inject('alice', 'groups')
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
        const { groups } = this.props;
        return (
            <Wrapper>
                <Row>
                    <Col xs={8} lg={6}>
                        <Groups />
                    </Col>
                    <Col xs={16} lg={groups.current && groups.showGroupInfo ? 12 : 18}>
                        <Main />
                    </Col>
                    <Col xs={0} lg={groups.current && groups.showGroupInfo ? 6 : 0}>
                        <GroupInfo />
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