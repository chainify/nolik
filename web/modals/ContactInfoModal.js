import React from 'react';
import PropTypes from 'prop-types';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { Input, Button, Modal, Divider } from 'antd';
import mouseTrap from 'react-mousetrap';
import { toJS } from 'mobx';

const Search = Input.Search;


@inject('index', 'groups')
@observer
class ContactInfoModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const { index, groups } = this.props;
        return (
            <div>
                <Modal
                    title="User info"
                    key="userInfo"
                    visible={index.showContactInfoModal}
                    closable={true}
                    onCancel={_ => {
                        index.showContactInfoModal = false;
                    }}
                    footer={[
                        <Button
                            key="cancel"
                            onClick={_ => {
                                index.showContactEditModal = true;
                            }}
                        >
                            Edit
                        </Button>,
                    ]}
                >
                    <p className="title">Address</p>
                    <p className="contactInfo">
                        {groups.fullName}
                        {/* {`https://nolik.im/pk/${bob.publicKey}`} */}
                    </p>
                    <Divider />
                    <p className="title">Full name</p>
                    <p className="contactInfo">
                        {groups.fullName}
                        {/* {bob.publicKey === bob.fullName ? '' : bob.fullName} */}
                    </p>
                </Modal>

                <style jsx>{`
                    p.title {
                        margin: 0;
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

ContactInfoModal.propTypes = {
    index: PropTypes.object,
};

export default withRouter(mouseTrap(ContactInfoModal))