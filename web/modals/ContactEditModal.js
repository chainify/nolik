import React from 'react';
import PropTypes from 'prop-types';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { Input, Button, Modal, Divider } from 'antd';
import mouseTrap from 'react-mousetrap';
import { toJS } from 'mobx';

const Search = Input.Search;


@inject('index', 'groups', 'contacts')
@observer
class ContactEditModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const { index, contacts } = this.props;
        return (
            <div>
                <Modal
                    title="New contact name"
                    key="userInfoEdit"
                    visible={index.showContactEditModal}
                    closable={true}
                    onCancel={_ => {
                        index.showContactEditModal = false;
                    }}
                    footer={[
                        <Button
                            key="cancelUserInfo"
                            onClick={_ => {
                                index.showContactEditModal = false;
                            }}
                        >
                            Cancel
                        </Button>,
                        <Button
                            key="saveUserInfo"
                            type="primary"
                            onClick={_ => {
                                contacts.saveContact();
                            }}
                        >
                            Save
                        </Button>,
                    ]}
                >
                    <Input
                        placeholder="Enter new contact name"
                        value={contacts.fullNameEdit}
                        onChange={e => {
                            contacts.fullNameEdit = e.target.value;
                        }}
                    />
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

ContactEditModal.propTypes = {
    index: PropTypes.object,
};

export default withRouter(mouseTrap(ContactEditModal))