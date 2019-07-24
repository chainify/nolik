import React from 'react';
import PropTypes from 'prop-types';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { Input, Button, Modal, Divider, Typography, Icon } from 'antd';
import mouseTrap from 'react-mousetrap';
import { toJS, autorun } from 'mobx';
import Cdm from '../components/Cdm';

const { Paragraph } = Typography;

@inject('index', 'groups', 'contacts', 'alice', 'cdm')
@observer
class ContactInfoModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const { index, groups, contacts, alice, cdm } = this.props;
        return (
            <div>
                <Modal
                    title={contacts.currentPublicKey === alice.publicKey ? 'Contact Info [YOU]' : 'Contact Info'}
                    visible={contacts.currentPublicKey !== null}
                    closable={true}
                    onCancel={_ => {
                        contacts.currentPublicKey = null;
                    }}
                    footer={null}
                >
                    <p className="title">Full name</p>
                    {
                        contacts.currentPublicKey === alice.publicKey ||
                        contacts.currentPublicKey === null ? (
                        <Paragraph ellipsis>
                            {contacts.list.filter(el => el.publicKey === contacts.currentPublicKey).length > 0 ? contacts.list.filter(el => el.publicKey === contacts.currentPublicKey)[0].fullName : contacts.currentPublicKey}
                        </Paragraph>
                    ) : (
                        <Paragraph
                            ellipsis
                            editable={{
                                onStart: () => {},
                                onChange: (e) => {
                                    const fullName = e.trim();
                                    if (fullName !== '') {
                                        contacts.saveContact(contacts.currentPublicKey, fullName);
                                        if (groups.current && groups.current.members.length === 2) {
                                            contacts.groupFullName = fullName;
                                            groups.setGroupFullName(fullName);

                                            if (groups.searchedList) {
                                                for (let i = 0; i < groups.searchedList.length; i += 1) {
                                                    const members = groups.searchedList[i].members;
                                                    members.map((member, m_index) => {
                                                        if (contacts.currentPublicKey === member.publicKey) {
                                                            groups.searchedList[i].fullName = fullName;
                                                        }
                                                    })
                                                }
                                            }
                                            
                                            
                                        }
                                    }
                                }
                            }}
                        >
                            {contacts.list.filter(el => el.publicKey === contacts.currentPublicKey).length > 0 ? contacts.list.filter(el => el.publicKey === contacts.currentPublicKey)[0].fullName : contacts.currentPublicKey}
                        </Paragraph>
                    )}
                    <Divider />
                    {(
                        groups.current && 
                        contacts.currentPublicKey && 
                        groups.current.members
                            .filter(el => el.publicKey === contacts.currentPublicKey).length > 0 &&
                        groups.current.members
                            .filter(el => el.publicKey === contacts.currentPublicKey)[0].isOnline
                        ) ? <div>Status: <span className="online">Online</span></div> :<div>Status: <span>Offline</span></div>}
                    <Divider />
                    <Button
                        type="primary"
                        onClick={_ => {
                            const groupHash = groups.createGroupHash([alice.publicKey, contacts.currentPublicKey]);
                            const group = groups.list && 
                                groups.list.filter(el => el.groupHash === groupHash).length > 0 &&
                                groups.list.filter(el => el.groupHash === groupHash)[0];

                            if (group) {
                                groups.setGroup(group);
                            } else {
                                const newGroup = {
                                    members: [{
                                        publicKey: contacts.currentPublicKey,
                                        lastActive: null,
                                    },
                                    {
                                        publicKey: alice.publicKey,
                                        lastActive: null,
                                    }],
                                    index: groups.list.length,
                                    groupHash: groupHash,
                                    fullName: `NEW:${groupHash}`,
                                    totalCdms: 0,
                                    readCdms: 0,
                                    lastCdm: null,
                                };
                                groups.searchedList = [newGroup];
                                groups.setGroup(newGroup);
                            }
                            contacts.currentPublicKey = null;
                            index.showGroupInfoModal = false;
                        }}
                    >
                        <Icon type="message"/> Send Message
                    </Button>
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

                    .online {
                        color: #4caf50;
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