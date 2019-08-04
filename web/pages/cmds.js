import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { Input, Button, Icon } from 'antd';

import PageHeader from '../components/PageHeader';
import CdmsList from '../components/Cdms';

@inject('cdms', 'groups')
@observer
class Cdms extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const { cdms } = this.props;
        cdms.initLevelDB();
        cdms.readList();
    }

    render() {
        const { cdms, groups } = this.props;   
        return (
            <div>
                <div className="container">
                    {groups.current && (
                        <PageHeader
                            goBack={
                                <Button
                                    type="ghost"
                                    shape="circle"
                                    onClick={_ => {
                                        groups.resetGroup();
                                    }}
                                >
                                    <Icon type="arrow-left" />
                                </Button>
                            }
                            title={groups.current.groupHash}
                            extra={[
                                <Button
                                    key="header_info_button"
                                    type="default"
                                    shape="circle"
                                    onClick={groups.toggleShowGroupInfo}
                                    disabled={groups.showGroupInfo}
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
                    )}
                    <div className={groups.current ? 'listCurrent' : 'listFull'}>
                        <CdmsList />
                    </div>
                </div>
                <style jsx>{`
                    .container {
                        height: 100vh;
                    }

                    .listFull {
                        height: 100vh;
                    }

                    .listCurrent {
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