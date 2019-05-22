import React from 'react';
import { observer, inject } from 'mobx-react';
import Message from './Message';
import * as moment from 'moment';
import { Divider } from 'antd';

@inject('cdm')
@observer
class Cdm extends React.Component {

    componentDidUpdate() {
        this.contentDiv.scrollTop = this.contentDiv.scrollHeight - this.contentDiv.clientHeight;
    }

    componentDidMount() {
        this.contentDiv.scrollTop = this.contentDiv.scrollHeight - this.contentDiv.clientHeight;
        // this.hiddenEl.scrollIntoView();
    }

    render() {
        const { cdm } = this.props;
        return (
            <div className="content" ref={el => { this.contentDiv = el; }}>
                <div className="list">
                    {cdm.list.map((item, index) => {
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
                            <div key={`message_${item.txId}_${item.index}`}>
                                {showDivider && (
                                    <Divider dashed style={{ color: '#fff' }}>
                                        <div className="divider">{moment.unix(item.timestamp).format('MMM DD')}</div>
                                    </Divider>
                                )}
                                <Message item={item} />
                            </div>
                        )
                    })}
                    <div className="hiddenEl" ref={el => { this.hiddenEl = el; }} />
                </div>
                <style jsx>{`
                    .content {
                        flex-grow: 1;
                        overflow-y: auto;
                        background: #2196f3;

                        // background: -moz-linear-gradient(45deg, rgba(224,224,224,1) 0%, rgba(255,255,255,1) 50%, rgba(242,242,242,1) 100%); /* ff3.6+ */
                        // background: -webkit-gradient(linear, left bottom, right top, color-stop(0%, rgba(224,224,224,1)), color-stop(50%, rgba(255,255,255,1)), color-stop(100%, rgba(242,242,242,1))); /* safari4+,chrome */
                        // background: -webkit-linear-gradient(45deg, rgba(224,224,224,1) 0%, rgba(255,255,255,1) 50%, rgba(242,242,242,1) 100%); /* safari5.1+,chrome10+ */
                        // background: -o-linear-gradient(45deg, rgba(224,224,224,1) 0%, rgba(255,255,255,1) 50%, rgba(242,242,242,1) 100%); /* opera 11.10+ */
                        // background: -ms-linear-gradient(45deg, rgba(224,224,224,1) 0%, rgba(255,255,255,1) 50%, rgba(242,242,242,1) 100%); /* ie10+ */
                        // background: linear-gradient(45deg, rgba(224,224,224,1) 0%, rgba(255,255,255,1) 50%, rgba(242,242,242,1) 100%); /* w3c */
                        // filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#F2F2F2', endColorstr='#E0E0E0',GradientType=1 ); /* ie6-9 */
                    }

                    .list {
                        min-height: calc(100vh - 110px);

                        display: flex;
                        justify-content: flex-end;
                        flex-direction: column;
                        padding: 2em 1em;
                    }

                    .divider {
                        font-size: 12px;
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