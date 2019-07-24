import React from 'react';
import PropTypes from 'prop-types';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { Input, Button, Modal, Divider, Typography } from 'antd';
import mouseTrap from 'react-mousetrap';
import { toJS, autorun } from 'mobx';

const { Paragraph } = Typography;

@inject('index', 'groups', 'contacts', 'alice')
@observer
class GroupInfoModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const { index, groups, contacts, alice } = this.props;
        return (
            <div>
                <Modal
                    title={'Group Info'}
                    visible={index.showGroupInfoModal}
                    closable={true}
                    onCancel={_ => {
                        index.showGroupInfoModal = false;
                    }}
                    footer={null}
                >
                    <p className="title">Full name</p>
                    {groups.current && groups.current.members.length === 2 ? (
                        <Paragraph ellipsis>
                            {contacts.groupFullName}
                        </Paragraph>
                    ) : (
                        <Paragraph
                            editable={{
                                onStart: () => {},
                                onChange: (e) => {
                                    contacts.groupFullName = e;
                                    if (contacts.groupFullName.trim() !== '') {
                                        contacts.saveGroup();
                                    }
                                }
                            }}
                        >
                            {contacts.groupFullName}
                        </Paragraph>
                    )}
                    
                    <Divider />
                    <h3>{'Group members'}</h3>
                    {groups.current && groups.current.members.slice().sort().map((el, index) => (
                        <p key={`member_${el.publicKey}`}>
                            {`${index + 1}. `}
                            <button
                                className="publicKeyBtn"
                                onClick={_ => {
                                    contacts.currentPublicKey = el.publicKey;
                                }}
                            >
                                {contacts.list.filter(item => item.publicKey === el.publicKey).length > 0 ? contacts.list.filter(item => item.publicKey === el.publicKey)[0].fullName : el.publicKey}
                            </button> 
                            {el.publicKey === alice.publicKey && <span className="you">You</span>}
                        </p>
                    ))}
                </Modal>

                <style jsx>{`
                    p.title {
                        margin: 0 0 0.5em 0;
                        color: #999;
                    }

                    p.contactInfo {
                        color: #333;
                    }

                    span.you {
                        color: #2196f3;
                        border: 1px solid #2196f3;
                        padding: 0.5em;
                        border-radius: 4px;
                        margin-left: 1em;
                    }

                    .publicKeyBtn {
                        border: none;
                        background: transparent;
                        padding: 0;
                        margin: 0;
                        text-align: left;
                        box-shadow: none;
                        outline:0;
                        cursor: pointer;
                        border-bottom: 1px dotted #999;
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