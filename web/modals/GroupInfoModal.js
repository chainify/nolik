import React from 'react';
import PropTypes from 'prop-types';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { Input, Button, Modal, Divider, Typography } from 'antd';
import mouseTrap from 'react-mousetrap';
import { toJS } from 'mobx';

const { Paragraph } = Typography;

@inject('index', 'groups', 'contacts')
@observer
class GroupInfoModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const { index, groups, contacts } = this.props;
        return (
            <div>
                <Modal
                    title="Group info"
                    key="addMembers"
                    visible={index.showGroupInfoModal}
                    closable={true}
                    onCancel={_ => {
                        index.showGroupInfoModal = false;
                    }}
                    // footer={[
                    //     <Button
                    //         key="cancelAddMembers"
                    //         onClick={_ => {
                    //             index.showGroupInfoModal = false;
                    //         }}
                    //     >
                    //         Cancel
                    //     </Button>,
                    //     <Button
                    //         key="addMembersSubmit"
                    //         type="primary"
                    //         loading={false}
                    //         onClick={_ => {

                    //         }}
                    //     >
                    //         Add
                    //     </Button>,
                    // ]}
                >
                    <p>Group Info</p>
                </Modal>

                <style jsx>{`
                    p.title {
                        margin: 0 0 0.5em 0;
                        color: #999;
                    }

                    p.contactInfo {
                        color: #333;
                    }
                `}</style>
            </div>
        );
    }
}

GroupInfoModal.propTypes = {
    index: PropTypes.object,
};

export default withRouter(mouseTrap(GroupInfoModal))