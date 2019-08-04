import React from 'react';
import { observer, inject } from 'mobx-react';
import { Badge, Icon, Typography, Progress } from 'antd';
import { toJS } from 'mobx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLevelDownAlt, faLevelUpAlt } from '@fortawesome/free-solid-svg-icons';

const { Paragraph } = Typography;

@inject('groups', 'cdms')
@observer
class Header extends React.Component {
    render() {
        const { item, groups, cdms } = this.props;
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
                            groups.current === null ||
                            (groups.current && groups.current.groupHash !== item.groupHash)
                        ) {
                            groups.setGroup(item);
                        }
                    }}
                >
                    <div className={`header ${groups.current && groups.current.groupHash === item.groupHash && 'active'}`}>
                        <div className="headerBody">
                            {item.lastCdm && (
                                <div className={`arrow ${item.lastCdm && item.lastCdm.direction}`}>
                                    <FontAwesomeIcon
                                        icon={
                                            item.lastCdm && item.lastCdm.direction === 'incoming'
                                            ? faLevelDownAlt
                                            : faLevelUpAlt
                                        }
                                    />
                                </div>
                            )}
                            <Paragraph ellipsis style={paragrapStyle}>
                                <span className={`headerTitle`}>
                                    {item.groupHash}
                                </span>
                            </Paragraph>
                            <Paragraph ellipsis style={paragrapStyle}>
                                <span className="headerMessage">
                                    {item.lastCdm ? 
                                        item.lastCdm.subject 
                                            ? <span> <b>{item.lastCdm.subject}</b> {item.lastCdm.message}</span>
                                            : item.lastCdm.message
                                        : 'No messages yet'}
                                </span>
                            </Paragraph>
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