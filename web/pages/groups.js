import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { Input, Button, Icon } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';

import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';
import Group from '../components/Group';

@inject('groups', 'heartbeat', 'compose')
@observer
class Groups extends React.Component {
    constructor(props) {
        super(props);
        const { groups, heartbeat } = props;

        this.heartbeatPeriodic = autorun(() => {
            if (heartbeat.pushStatus === 'success') {
                heartbeat.push();
            }
        })

        this.initialHeartbeat = autorun(() => {
            if (
                groups.list !== null &&
                heartbeat.pushStatus === 'init'
            ) {
                heartbeat.push();
            }
        });

        // this.groupsRead = autorun(() => {
        //     if (groups.lastTxId !== null) {
        //         groups.readList();
        //     }
        // });
    }

    componentDidMount() {
        const { groups } = this.props;
        groups.initLevelDB();
        groups.readList();
    }

    componentWillUnmount() {
        this.heartbeatPeriodic();
        this.initialHeartbeat();
        // this.groupsRead();
    }


    render() {
        const { groups, compose } = this.props;
        return (
            <div>
                <div className="container">
                    <PageHeader
                        extra={[
                            <Input
                                key="header_search_field"
                                placeholder="search"
                                style={{ width: '100%' }}
                                value={groups.search}
                                onChange={e => {
                                    groups.search = e.target.value;
                                }}
                            />,
                            <Button
                                key="header_compose_button"
                                type="primary"
                                shape="circle"
                                onClick={compose.toggleCompose}
                                disabled={compose.composeMode}
                            >
                                <FontAwesomeIcon icon={faPen} />
                            </Button>
                        ]}
                    />
                    <div className="list">
                        {groups.list === null && groups.fakeGroups.map(el => (
                            <Skeleton key={`skeleton_${el}`} />
                        ))}
                        {groups.list && groups.list.length === 0 && (
                            <div className="noMessages">No messages yet</div>
                        )}
                        {groups.list && groups.list.length > 0 && groups.list.map(el => (
                            <Group item={el} key={`group_${el.groupHash}`} />
                        ))}
                    </div>
                </div>
                <style jsx>{`
                    .container {
                        heightL 100vh;
                        border-right: 1px solid #e0e0e0;
                    }

                    .list {
                        height: calc(100vh - 52px);
                        background: #ddd;
                    }

                    .noMessages {
                        text-align: center;
                        line-height: 24px;
                        font-size: 18px;
                        color: #999;
                        font-weight: 100;
                        font-family: 'Roboto', sans-serif;
                        padding: 2em 0;
                    }
                `}</style>
            </div>
        );
    }
}

Groups.propTypes = {
    index: PropTypes.object,
};

export default Groups;