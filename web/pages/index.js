import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import Wrapper from '../components/Wrapper';
import { Row, Col, Input, Button, Icon } from 'antd';

import Groups from './groups';
import Main from './main';

@inject('alice', 'index', 'cdms', 'contacts', 'groups')
@observer
class Index extends React.Component {
    constructor(props) {
        super(props);
        const { alice, groups, router, cdms, contacts } = this.props;
        
        this.authPeriodicChecker = setInterval(() => {
            alice.authCheck();
        }, 200);


        // autorun(() => {
        //     if (alice.publicKey && alice.updateHeartbeatStatus === 'init') {
        //         alice.updateHeartbeat();
        //     }
        // });

        // this.aliceHeartbeatPeriodic = autorun(() => {
        //     if (alice.updateHeartbeatStatus === 'success') {
        //         alice.updateHeartbeat();
        //     }
        // });

        // autorun(() => {
        //     if (
        //         cdms.lastCdmHash === null && 
        //         groups.list === null
        //     ) {
        //         groups.getList();
        //     }
        // });

        // autorun(() => {
        //     if (
        //         groups.list &&
        //         cdms.lastCdmHash && 
        //         groups.list.slice(0, 3).map(el => el.lastCdm && el.lastCdm.attachmentHash).indexOf(cdms.lastCdmHash) < 0
        //     ) {
        //         groups.getList();
        //     }
        // });

        // autorun(() => {
        //     if (
        //         groups.list &&
        //         groups.current &&
        //         cdms.list === null
        //     ) {
        //         cdms.getList();
        //     }
        // });
    }


    componentWillUnmount() {
        // const { groups } = this.props;
        // groups.list = null;
        // this.aliceHeartbeatPeriodic();
        clearInterval(this.authPeriodicChecker);
    }

    render() {        
        return (
            <Wrapper>
                <Row>
                    <Col xs={8} lg={6}>
                        <Groups />
                    </Col>
                    <Col xs={16} lg={18}>
                        <Main />
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