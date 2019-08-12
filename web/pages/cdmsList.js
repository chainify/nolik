import React from 'react';
import { observer, inject } from 'mobx-react';
import { autorun } from 'mobx';
import Message from './../components/Message';
import * as moment from 'moment';
import { Divider } from 'antd';
import NoSSR from 'react-no-ssr';

@inject('cdms', 'groups')
@observer
class Cdms extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidUpdate() {
        this.contentDiv.scrollTop = 0;
    }

    componentDidMount() {
        const { cdms } = this.props;
        this.contentDiv.scrollTop = 0;
    }

    render() {
        const { cdms, groups } = this.props;
        return (
            <div className="content" ref={el => { this.contentDiv = el; }}>
                <NoSSR>
                    <div className="list">
                        {cdms.list && cdms.list.map(item => {
                            if (groups.current && item.groupHash === groups.current.groupHash) {
                                return (
                                    <div className="messageContainer" key={`message_${item.messageHash}_${item.timestamp}`}>
                                        <Message item={item} />
                                    </div>
                                )
                            }
                        })}
                    </div>
                </NoSSR>
                <style jsx>{`
                    .content {
                        height: 100%;
                        overflow-y: auto;
                        padding: 0 1em;
                    }

                    .list {
                        display: flex;
                        justify-content: flex-end;
                        flex-direction: column;
                        padding: 1em 0em;
                    }

                    .divider {
                        font-size: 14px;
                        font-weight: 100;
                    }

                    .messageContainer {
                        padding-left: 2em;
                        padding-bottom: 2em;
                    }

                    .messageContainer:first-child {
                        padding-left: 0;
                    }
                `}</style>
            </div>
        );
    }
}

Cdms.propTypes = {
    // index: PropTypes.object,
};

export default Cdms