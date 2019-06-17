import React from 'react';
import { observer, inject } from 'mobx-react';
import { Badge, Icon, Typography } from 'antd';
const { Paragraph } = Typography;

@inject('groups', 'cdm')
@observer
class Header extends React.Component {
    render() {
        const { item, groups, cdm } = this.props;
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
                            cdm.list = [];
                            groups.setGroup(item);
                        }
                    }}
                >
                    <div className={`header ${groups.current && groups.current.groupHash === item.groupHash && 'active'}`}>
                        <div className="headerBody">
                            <Paragraph ellipsis style={paragrapStyle}>
                                <span className="headerTitle">{item.fullName}</span>
                            </Paragraph>
                            <Paragraph ellipsis style={paragrapStyle}>
                                <span className="headerMessage">
                                    {item.lastCdm ? item.lastCdm.message : 'No messages yet'}
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
                        background: transparent;
                        padding: 0;
                        margin: 0;
                        width: 100%;
                        text-align: left;
                        box-shadow: none;
                        outline:0;
                        cursor: pointer;
                        color: #999;
                    }

                    .button:hover {
                        background: #eee;
                    }

                    .button * {
                        pointer-events: none;
                    }

                    .header {
                        padding: 10px 10px 10px 0px;
                        display: flex;
                    }

                    .header.active {
                        background: #ddd; 
                    }

                    .headerBody {
                        flex-grow: 1;
                        padding-left: 40px;
                        overflow-x: hidden;
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