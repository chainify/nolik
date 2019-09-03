import React from 'react';
import { observer, inject } from 'mobx-react';
import Message from '../../components/Message';
import NoSSR from 'react-no-ssr';
import { toJS } from 'mobx';

@inject('cdms', 'threads')
@observer
class Cdms extends React.Component {

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.contentDiv.scrollTop = this.contentDiv.scrollHeight - this.contentDiv.clientHeight;
    }

    render() {
        const { threads } = this.props;
        return (
            <div className="content" ref={el => { this.contentDiv = el; }}>
                <div className="list">
                    <NoSSR>
                        {threads.current.cdms.map(item => (
                            <div className="messageContainer" key={`message_${item.messageHash}_${item.timestamp}`}>
                                <Message item={item} />
                            </div>
                        ))}
                    </NoSSR>
                </div>
                <style jsx>{`
                    .content {
                        height: 100%;
                        overflow-y: auto;
                        padding: 0 1em;
                        background: #fff;
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
                        padding-left: 0em;
                        padding-bottom: 0em;
                    }

                    .messageContainer:first-child {
                        padding-left: 0em;
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