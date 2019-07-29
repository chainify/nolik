import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import Router from 'next/router';
import { Input, Button, Modal, Divider, Typography, Icon, Steps, Checkbox } from 'antd';
import { toJS } from 'mobx';

const { Paragraph } = Typography;
const { Step } = Steps;

@inject('index', 'groups', 'contacts', 'alice', 'cdm')
@observer
class NewGroupMembersModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const { index, groups, contacts, alice, cdm } = this.props;
        return (
            <div>
                <Modal
                    title={null}
                    key="addMembers"
                    visible={index.showNewGroupMembersModal}
                    closable={true}
                    onCancel={_ => {
                        index.resetNewGroupMember();
                        index.showNewGroupMembersModal = false;
                    }}
                    footer={[
                        <Button
                            key="cancelAddMembers"
                            onClick={_ => {
                                if (index.currentStep === 0) {
                                    index.showNewGroupMembersModal = false;
                                    index.resetNewGroupMember();
                                }
                                if (index.currentStep === 1) {
                                    index.currentStep = 0;
                                }
                            }}
                        >
                            {index.currentStep === 0 && 'Cancel'}
                            {index.currentStep === 1 && 'Back'}
                        </Button>,
                        <Button
                            key="addMembersSubmit"
                            type="primary"
                            loading={false}
                            disabled={index.newGroupMembers.length === 0}
                            loading={cdm.forwardCdmStatus === 'pending'}
                            onClick={_ => {
                                if (index.currentStep === 1) {
                                    const recipients = toJS(groups.current.members.concat(index.newGroupMembers));
                                    const groupHash = groups.createGroupHash(recipients);
                                    const newGroup = {
                                        members: recipients,
                                        groupHash: groupHash,
                                        fullName: index.newGroupName === '' ? 'NEW:' + groupHash : index.newGroupName,
                                        totalCdms: 0,
                                        readCdms: 0,
                                        lastCdm: null,
                                    };
                                    groups.newGroups.push(newGroup);
                                    contacts.saveContact(groupHash, index.newGroupName);
                                    
                                    if (index.forwardPreviousMessages) {
                                        cdm.forwardCdms();
                                    } else {
                                        groups.setGroup(newGroup); 
                                        index.currentStep = 0;
                                        index.searchValue = '';
                                        index.showNewGroupMembersModal = false;
                                    }
                                }
                                if (index.currentStep === 0) {
                                    index.currentStep = 1;
                                }
                            }}
                        >
                            {index.currentStep === 0 && `Add ${index.newGroupMembers.length > 0 ? index.newGroupMembers.length : ''}`}
                            {index.currentStep === 1 && (index.forwardPreviousMessages ? 'Add new members and forward messages' : 'Add new members')}
                        </Button>,
                    ]}
                >
                    <Paragraph
                        ellipsis
                        style={{
                            margin: '0 4em 2em 0',
                            padding: 0,
                        }}
                    >
                        {groups.current && groups.current.fullName}
                    </Paragraph>
                    <Steps size="small" current={index.currentStep}>
                        <Step title="New members" />
                        <Step title="Customize" />
                    </Steps>
                    {index.currentStep === 0 && (
                        <div className="stepContent">
                            <Input
                                placeholder="Public key / Contact"
                                prefix={<Icon type="search" style={{ color: '#ddd' }} />}
                                suffix={index.searchValue.length > 0 && (
                                    <button
                                        className="clearSearch"
                                        onClick={_ => {
                                            index.searchValue = '';
                                        }}
                                    >
                                        <Icon type="close-circle" theme="filled" />
                                    </button>
                                )}
                                autoFocus
                                key="newGroupSearchInput"
                                size="default"
                                value={index.searchValue}
                                onChange={e => {
                                    index.searchValue = e.target.value;
                                    if (e.target.value.length === 44) {
                                        if (
                                            groups.current.members.filter(member => member === e.target.value).length === 0 &&
                                            contacts.list.filter(el => el.publicKey === e.target.value).length === 0
                                        ) {
                                            contacts.list.push({
                                                publicKey: e.target.value,
                                                groupHash: groups.createGroupHash([alice.publicKey, e.target.value]),
                                                fullName: `${e.target.value}`
                                            })
                                        } 
                                    }
                                }}
                            />
                            <div className="contacts">
                                {groups.current && groups.current.members.slice().sort().map((member, index) => (
                                    <div key={`member_${member}`} className="newMember">
                                        <div className="fullName">
                                            {`${index + 1}. `}
                                            <button
                                                className="publicKeyBtn"
                                                onClick={_ => {
                                                    contacts.currentPublicKey = member;
                                                }}
                                            >
                                                {contacts.list.filter(cl => cl.publicKey === member).length > 0
                                                    ? contacts.list.filter(cl => cl.publicKey === member)[0].fullName
                                                    : member}
                                            </button>
                                        </div>
                                        <div className="button">
                                            <Button
                                                type={'primary'}
                                                shape="circle"
                                                icon={'check'}
                                                size="small"
                                                disabled
                                            />
                                        </div>
                                    </div>
                                ))}
                                {groups.current &&
                                    contacts.list.slice().sort()
                                        .filter(el => el.fullName.toLowerCase().search(index.searchValue.toLowerCase()) > -1)
                                        .filter(el => el.publicKey !== null)
                                        .filter(el => el.publicKey.length === 44)
                                        .filter(el => groups.current.members.indexOf(el.publicKey) ===  -1)
                                        .map((el, el_index) => (
                                            <div key={`el_${el.publicKey}`} className="newMember">
                                                <div className="fullName">
                                                    {`${groups.current.members.length + el_index + 1}. `}
                                                    <button
                                                        className="publicKeyBtn"
                                                        onClick={_ => {
                                                            contacts.currentPublicKey = el.publicKey;
                                                        }}
                                                    >
                                                        {el.fullName}
                                                    </button>
                                                </div>
                                                <div className="button">
                                                    <Button
                                                        type={index.newGroupMembers.indexOf(el.publicKey) === -1 ? 'default' : 'primary'}
                                                        shape="circle"
                                                        icon={index.newGroupMembers.indexOf(el.publicKey) === -1 ? 'plus' : 'check'}
                                                        size="small"
                                                        onClick={_ => {
                                                            const pkIndex = index.newGroupMembers.indexOf(el.publicKey);
                                                            if (pkIndex === -1) {
                                                                index.newGroupMembers.push(el.publicKey);
                                                            } else {
                                                                index.newGroupMembers.splice(pkIndex, 1);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {index.currentStep === 1 && (
                        <div className="stepContent">
                            <div className="contacts">
                                <h2>Group name (optional)</h2>
                                <Input
                                    placeholder="Enter group name"
                                    key="mewGroupName"
                                    size="default"
                                    value={index.newGroupName}
                                    onChange={e => {
                                        index.newGroupName = e.target.value;
                                    }}
                                />
                                <Divider />
                                <Checkbox
                                    onChange={e => {
                                        index.forwardPreviousMessages = e.target.checked
                                    }}
                                    checked={groups.current && groups.current.lastCdm === null ? false : index.forwardPreviousMessages}
                                    disabled={groups.current && groups.current.lastCdm === null}
                                >
                                    Forward previous messages
                                </Checkbox>
                                <Divider />
                                {groups.current && groups.current.members.slice().sort().map((member, index) => (
                                    <div key={`member_${member}`} className="newMember">
                                        <div className="fullName">
                                            {`${index + 1}. `}
                                            <button
                                                className="publicKeyBtn"
                                                onClick={_ => {
                                                    contacts.currentPublicKey = member;
                                                }}
                                            >
                                                {contacts.list.filter(cl => cl.publicKey === member).length > 0
                                                    ? contacts.list.filter(cl => cl.publicKey === member)[0].fullName
                                                    : member}
                                            </button>
                                        </div>
                                        <div className="button">
                                            <Button
                                                type={'primary'}
                                                shape="circle"
                                                icon={'check'}
                                                size="small"
                                                disabled
                                            />
                                        </div>
                                    </div>
                                ))}
                                {groups.current && index.newGroupMembers.map((el, el_index)=> (
                                    <div key={`new_el_${el}`} className="newMember">
                                        <div className="fullName">
                                            {`${groups.current.members.length + el_index + 1}. `}
                                            <button
                                                className="publicKeyBtn"
                                                onClick={_ => {
                                                    contacts.currentPublicKey = el;
                                                }}
                                            >
                                                {contacts.list.filter(cl => cl.publicKey === el).length > 0
                                                    ? contacts.list.filter(cl => cl.publicKey === el)[0].fullName
                                                    : el}
                                            </button>
                                        </div>
                                        <div className="button">
                                            <Button
                                                type={'primary'}
                                                shape="circle"
                                                icon={'check'}
                                                size="small"
                                                onClick={_ => {                                                    
                                                    const pkIndex = index.newGroupMembers.indexOf(el);
                                                    index.newGroupMembers.splice(pkIndex, 1);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Modal>

                <style jsx>{`
                    p.title {
                        margin: 0 0 0.5em 0;
                        color: #999;
                    }

                    p.contactInfo {
                        color: #333;
                    }

                    div.newMember {
                        display: flex;
                        width: 100%;
                        padding: 0.5em 1em;
                    }

                    div.newMember:hover {
                        background: #eee;
                    }

                    div.newMember div.fullName {
                        flex-grow: 1;
                        text-align: left;
                    }

                    div.newMember div.button {
                        flex-grow: 1;
                        text-align: right;
                    }

                    button.clearSearch {
                        border: none;
                        background: transparent;
                        padding: 0;
                        margin: 0;
                        width: 100%;
                        box-shadow: none;
                        outline:0;
                        cursor: pointer;
                        color: #999;
                    }

                    div.stepContent {
                        padding-top: 1em;
                    }

                    div.contacts {
                        padding: 1em 0;
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

NewGroupMembersModal.propTypes = {
    index: PropTypes.object,
};

export default NewGroupMembersModal