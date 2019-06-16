import React from 'react';
import { observer, inject } from 'mobx-react';
import Message from './Message';
import * as moment from 'moment';
import { Divider } from 'antd';
import NoSSR from 'react-no-ssr';

@inject('cdm')
@observer
class Cdm extends React.Component {

    componentDidUpdate() {
        this.contentDiv.scrollTop = this.contentDiv.scrollHeight - this.contentDiv.clientHeight;
    }

    componentDidMount() {
        this.contentDiv.scrollTop = this.contentDiv.scrollHeight - this.contentDiv.clientHeight;
    }

    render() {
        const { cdm } = this.props;
        return (
            <div className="content" ref={el => { this.contentDiv = el; }}>
                <NoSSR>
                    <div className="list">
                        {cdm.list && cdm.list.length > 0 && cdm.list.map((item, index) => {
                            let showDivider = false;
                            if (index === 0) { showDivider = true }
                            if (
                                index > 0 && 
                                moment.unix(cdm.list[index-1].timestamp).format('MMM DD') !== 
                                    moment.unix(cdm.list[index].timestamp).format('MMM DD')
                            ) {
                                showDivider = true;
                            }
                            return (
                                <div key={`message_${item.hash}_${item.type}`}>
                                    {cdm.getListStatus === 'success' && showDivider && (
                                        <Divider dashed style={{ background: '#fff', opacity: 0.5 }}>
                                            <div className="divider">{moment.unix(item.timestamp).format('MMM DD')}</div>
                                        </Divider>
                                    )}
                                    <Message item={item} />
                                </div>
                            )
                        })}
                    </div>
                </NoSSR>
                <style jsx>{`
                    .content {
                        flex-grow: 1;
                        overflow-y: auto;
                        background: #efebe9;
                        padding: 0 4em;
                    }

                    .list {
                        min-height: calc(100vh - 110px);

                        display: flex;
                        justify-content: flex-end;
                        flex-direction: column;
                        padding: 2em 1em;
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

Cdm.propTypes = {
    // index: PropTypes.object,
};

export default Cdm