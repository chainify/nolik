import React from 'react';
import { observer, inject } from 'mobx-react';
import Message from './Message';
import * as moment from 'moment';
import { Divider } from 'antd';
import NoSSR from 'react-no-ssr';

@inject('cdms', 'groups')
@observer
class Cdms extends React.Component {

    componentDidUpdate() {
        this.contentDiv.scrollTop = this.contentDiv.scrollHeight - this.contentDiv.clientHeight;
    }

    componentDidMount() {
        this.contentDiv.scrollTop = this.contentDiv.scrollHeight - this.contentDiv.clientHeight;
    }

    render() {
        const { cdms, groups } = this.props;
        return (
            <div className="content" ref={el => { this.contentDiv = el; }}>
                <NoSSR>
                    <div className="list">
                        {cdms.list && cdms.list.map(item => {
                            // if (groups.current && item.groupHash !== groups.current.groupHash) {
                            //     return null;
                            // }
                            return <Message item={item}  key={`message_${item.messageHash}_${item.timestamp}`} />
                        })}
                    </div>
                </NoSSR>
                {/* <NoSSR>
                    <div className="list">
                        {cdms.list && cdms.list.length > 0 && cdms.list.map((item, index) => {
                            let showDivider = false;
                            if (index === 0) { showDivider = true }
                            if (
                                index > 0 && 
                                moment.unix(cdms.list[index-1].timestamp).format('MMM DD') !== 
                                    moment.unix(cdms.list[index].timestamp).format('MMM DD')
                            ) {
                                showDivider = true;
                            }
                            return (
                                <div key={`message_${item.messageHash}_${item.timestamp}`}>
                                    {cdms.getListStatus === 'success' && showDivider && (
                                        <Divider dashed style={{ background: '#fff', opacity: 0.5 }}>
                                            <div className="divider">{moment.unix(item.timestamp).format('MMM DD')}</div>
                                        </Divider>
                                    )}
                                    <Message item={item} />
                                </div>
                            )
                        })}
                    </div>
                </NoSSR> */}
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
                `}</style>
            </div>
        );
    }
}

Cdms.propTypes = {
    // index: PropTypes.object,
};

export default Cdms