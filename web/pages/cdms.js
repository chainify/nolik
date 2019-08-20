import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { Input, Button, Icon } from 'antd';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';

import PageHeader from '../components/PageHeader';
import CdmsList from './cdmsList';

@inject('threads', 'compose')
@observer
class Cdms extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { threads, compose } = this.props;   
        return (
            <div>
                <div className="container">
                    {threads.current && (
                        <PageHeader
                            goBack={
                                <Button
                                    type="ghost"
                                    shape="circle"
                                    onClick={_ => {
                                        threads.resetThread();
                                    }}
                                >
                                    <Icon type="arrow-left" />
                                </Button>
                            }
                            title={threads.current.cdms[threads.current.cdms.length-1].subject}
                            extra={[
                                <Button
                                    key="header_write_to_thread"
                                    type="primary"
                                    shape="round"
                                    onClick={compose.toggleComment}
                                    disabled={compose.addMemberOn}
                                >
                                     Reply to All
                                </Button>,
                                <Button
                                    key="header_info_button"
                                    type="default"
                                    shape="circle"
                                    onClick={threads.toggleShowThreadInfo}
                                    disabled={threads.showThreadInfo}
                                >
                                    <Icon type="info" />
                                </Button>,
                                <Button
                                    key="header_add_thread_member_button"
                                    type="default"
                                    shape="circle"
                                    onClick={compose.toggleAddMeber}
                                    disabled={compose.addMemberOn}
                                >
                                    <Icon type="usergroup-add" />
                                </Button>,
                            ]}
                        />
                    )}
                    <div className={threads.current ? 'listCurrent' : 'listFull'}>
                        {threads.current && <CdmsList />}
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