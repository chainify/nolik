import React from 'react';
import { observer, inject } from 'mobx-react';
import { Badge, Icon, Typography, Progress } from 'antd';
import { toJS } from 'mobx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLevelDownAlt, faLevelUpAlt } from '@fortawesome/free-solid-svg-icons';

const { Paragraph } = Typography;

@inject('threads', 'compose')
@observer
class Header extends React.Component {
    render() {
        const { item, threads, compose } = this.props;
        const paragrapStyle = {
            margin: 0,
            padding: 0,
            color: '#999',
        };

        return (
            <div>
                <button
                    type="button"
                    className="button"
                    onClick={() => {
                        if (
                            threads.current === null ||
                            (threads.current && threads.current.threadHash !== item.threadHash)
                        ) {
                            threads.setThread(item);
                        }
                    }}
                >
                    <div className={`header ${threads.current && threads.current.threadHash === item.threadHash && 'active'}`}>
                        <div className="headerBody">
                            <div className={`arrow ${item.cdms[0] && item.cdms[0].direction}`}>
                                <FontAwesomeIcon
                                    icon={
                                        item.cdms[0].direction === 'incoming'
                                        ? faLevelDownAlt
                                        : faLevelUpAlt
                                    }
                                />
                            </div>
                            <div>
                                {item.cdms[item.cdms.length-1].subject && (
                                    <Paragraph ellipsis style={paragrapStyle}>
                                        <span className={`headerTitle`}>
                                            {item.cdms[item.cdms.length-1].subject}
                                        </span>
                                    </Paragraph>
                                )}
                                {!item.cdms[item.cdms.length-1].subject && item.cdms[item.cdms.length-1].message && (
                                    <Paragraph ellipsis style={paragrapStyle}>
                                        <span className={`headerTitle`}>
                                            {item.cdms[item.cdms.length-1].message}
                                        </span>
                                    </Paragraph>
                                )}
                                <Paragraph ellipsis={{ rows: item.cdms[0].subject ? 1 : 2 }} style={paragrapStyle}>
                                    <span className="headerMessage">
                                        {item.cdms[0].subject 
                                            ? <span>{item.cdms[0].message}</span>
                                            : item.cdms[0].message}
                                    </span>
                                </Paragraph>
                            </div>
                        </div>
                        <div className="badgeDiv">
                            {item.totalCdms - item.readCdms > 0 && (
                                <Badge count={item.totalCdms - item.readCdms} />
                            )}
                            {item.totalCdms - item.readCdms < 0 && (
                                <Badge count={<Icon type="clock-circle" style={{ marginRight: 10 }} />} />
                            )}
                        </div>
                    </div>
                </button>
                <style jsx>{`
                    .button {
                        border: none;
                        background: #fff;
                        padding: 0;
                        margin: 0;
                        width: 100%;
                        text-align: left;
                        box-shadow: none;
                        outline:0;
                        cursor: pointer;
                        color: #999;
                        overflow-x: hidden;
                    }

                    .button:hover {
                        background: #fafafa;
                    }

                    .button * {
                        pointer-events: none;
                    }

                    .header {
                        padding: 10px 10px 10px 0px;
                        display: flex;
                        max-width: 600px;
                    }

                    .header.active {
                        background: #eee; 
                    }

                    .headerBody {
                        flex-grow: 1;
                        padding-left: 40px;
                        overflow-x: hidden;
                        position: relative;
                    }

                    .arrow {
                        position: absolute;
                        top: 0px;
                        left: 24px;
                    }

                    .arrow.incoming {
                        color: #66bb6a;
                    }

                    .arrow.outgoing {
                        color: #e57373;
                    }
                    
                    .headerTitle {
                        color: #333;
                    }

                    .headerMessage {}

                    .badgeDiv {
                        flex-basis: 40px;
                        min-width: 40px;
                        height: 40px;
                        text-align: right;
                    }
                `}</style>
            </div>
        );
    }
}

Header.propTypes = {
    // index: PropTypes.object,
};

export default Header