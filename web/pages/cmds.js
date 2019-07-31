import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { Input, Button, Icon } from 'antd';

import PageHeader from '../components/PageHeader';

// @inject('alice', 'index', 'cdms', 'contacts', 'groups')
@observer
class Cdms extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {        
        return (
            <div>
                <div className="container">
                    <PageHeader
                        goBack={
                            <Button
                                type="ghost"
                                shape="circle"
                            >
                                <Icon type="arrow-left" />
                            </Button>
                        }
                        title="9u8vhaDsoSy6esLEL1TyL9yroz79GWB2kkUF132bASyq"
                        extra={[
                            <Button
                                key="header_info_button"
                                type="default"
                                shape="circle"
                            >
                                <Icon type="info" />
                            </Button>,
                            <Button
                                key="header_add_group_member_button"
                                type="default"
                                shape="circle"
                            >
                                <Icon type="usergroup-add" />
                            </Button>,
                        ]}
                    />
                    <div className="list">

                    </div>
                </div>
                <style jsx>{`
                    .container {
                        height: 100vh;
                    }

                    .list {
                        height: calc(100vh - 52px);
                    }
                `}</style>
            </div>
        );
    }
}

Cdms.propTypes = {
    index: PropTypes.object,
};

export default Cdms;