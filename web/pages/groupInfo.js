import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { Typography, Button, Icon } from 'antd';
import PageHeader from '../components/PageHeader';
const { Paragraph } = Typography;


@inject('groups')
@observer
class GroupInfo extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { groups } = this.props;
        const pstyle = {
            margin: 0,
            padding: 0,
        };

        return (
            <div>
                <div className="container">
                    <PageHeader
                        goBack={
                            <Button
                                type="ghost"
                                shape="circle"
                                onClick={_ => {
                                    groups.toggleShowGroupInfo();
                                }}
                            >
                                <Icon type="close" />
                            </Button>
                        }
                    />
                    <div className="info">
                        <h2>Title</h2>
                        <div className="groupInfo">
                            {groups.current && groups.current.groupHash}
                        </div>
                        <h2>Members</h2>
                        <div className="groupInfo">
                            {groups.current && groups.current.members.map((el, index)=> (
                                <p className="member">
                                    <Paragraph ellipsis style={pstyle}>{index + 1}. {el}</Paragraph>
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
                <style jsx>{`
                    .container {
                        height: 100vh;
                        background: #ddd;
                        border-left: 1px solid #e0e0e0;
                    }

                    .info {
                        padding: 1em;
                    }

                    h2 {
                        font-weight: 400;
                    }

                    .groupInfo {
                        background: #fff;
                        padding: 1em 2em;
                        word-wrap: break-word;
                        margin-bottom: 2em;
                    }

                    .member {
                        overflow-x: hidden;
                        margin: 0;
                    }
                `}</style>
            </div>
        );
    }
}

GroupInfo.propTypes = {
    // index: PropTypes.object,
};

export default GroupInfo;