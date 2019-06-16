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
class ContactInfoModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const { index, groups, contacts } = this.props;
        return (
            <div>
                <Modal
                    title={'Contact Info'}
                    visible={index.showContactInfoModal}
                    closable={true}
                    onCancel={_ => {
                        index.showContactInfoModal = false;
                    }}
                    footer={null}
                >
                    <p className="title">Full name</p>
                    <Paragraph
                        editable={{
                            onStart: () => {},
                            onChange: (e) => {
                                contacts.fullNameEdit = e;
                                contacts.saveContact();
                            }
                        }}
                    >
                        {contacts.fullNameEdit}
                    </Paragraph>
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

ContactInfoModal.propTypes = {
    index: PropTypes.object,
};

export default withRouter(mouseTrap(ContactInfoModal))