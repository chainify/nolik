import React from 'react';
import { observer, inject } from 'mobx-react';
import { autorun } from 'mobx';
import Message from './Message';
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
        console.log('update');
        // this.contentDiv.scrollTop = this.contentDiv.scrollHeight - this.contentDiv.clientHeight;
        this.contentDiv.scrollTop = 0;
    }

    componentDidMount() {
        const { cdms } = this.props;
        // console.log('mount', this.contentDiv);
        // console.log('mount', this.contentDiv.scrollTopMax, this.contentDiv.clientHeight);
        this.contentDiv.scrollTop = 0;
        // if (
        //     this.contentDiv &&
        //     cdms.list &&
        //     cdms.list.length > 0 && 
        //     this.contentDiv.scrollHeight - this.contentDiv.clientHeight > 0
        // ) {
        //     console.log('zxc');
            
        //     this.contentDiv.scrollTop = this.contentDiv.scrollHeight - this.contentDiv.clientHeight;
        // }
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