import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { Input, Button, Icon } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faInbox } from '@fortawesome/free-solid-svg-icons';

import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';
import Thread from '../components/Thread';

@inject('threads', 'heartbeat', 'compose', 'alice', 'notifiers')
@observer
class Threads extends React.Component {
    constructor(props) {
        super(props);
        const { heartbeat } = props;

        this.heartbeatPeriodic = autorun(() => {
            if (heartbeat.pushStatus === 'success') {
                heartbeat.push();
            }
        })

        this.initialHeartbeat = autorun(() => {
            const { threads } = this.props;
            if (
                threads.list !== null &&
                heartbeat.pushStatus === 'init'
            ) {
                heartbeat.push();
            }
        });
    }

    componentDidMount() {
        const { threads } = this.props;
        threads.initLevelDB();
        // threads.dropList();
        threads.readList();
    }

    componentWillUnmount() {
        this.heartbeatPeriodic();
        this.initialHeartbeat();
    }


    render() {
        const { threads, compose, alice, notifiers } = this.props;
        return (
            <div>
                <div className="container">
                    <PageHeader
                        goBack={
                            <Button
                                key="header_logout_button"
                                type="default"
                                shape="circle"
                                onClick={alice.logOut}
                            >
                                <Icon type="poweroff" />
                            </Button>
                        }
                        extra={[
                            <Input
                                key="header_search_field"
                                placeholder="Search"
                                style={{ width: '100%' }}
                                value={threads.search}
                                onChange={e => {
                                    notifiers.info('Not available yet')
                                    // threads.search = e.target.value;
                                }}
                            />,
                            <Button
                                key="header_compose_button"
                                type="primary"
                                shape="circle"
                                onClick={compose.toggleCompose}
                                disabled={
                                    compose.composeMode ||
                                    threads.current
                                }
                            >
                                <FontAwesomeIcon icon={faPen} />
                            </Button>
                        ]}
                    />
                    <div className="list">
                        {threads.list === null && threads.fakeThreads.map(el => (
                            <Skeleton key={`skeleton_${el}`} />
                        ))}
                        {threads.list && threads.list.length === 0 && (
                            <div className="noMessages">
                                <FontAwesomeIcon icon={faInbox} /> No messages yet
                            </div>
                        )}
                        {threads.list && threads.list.length > 0 && threads.list.map(el => (
                            <Thread item={el} key={`thread_${el.threadHash}`} />
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
                        overflow-y: auto;
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

Threads.propTypes = {
    index: PropTypes.object,
};

export default Threads;