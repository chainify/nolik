import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Input, Button, Modal, Divider, Typography, Icon, Steps, Checkbox } from 'antd';
import { toJS } from 'mobx';

const { Paragraph } = Typography;
const { Step } = Steps;

@inject('index', 'groups', 'contacts', 'alice', 'cdm')
@observer
class GroupInfoModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const { index, groups, contacts, alice, cdm } = this.props;
        return (
            <div>
                <Modal
                    title={groups.current && groups.current.fullName}
                    key="addMembers"
                    visible={index.showGroupInfoModal}
                    closable={true}
                    onCancel={_ => {
                        index.showGroupInfoModal = false;
                    }}
                    footer={[
                        <Button
                            key="cancelAddMembers"
                            onClick={_ => {
                                if (index.currentStep === 0) {
                                    index.showGroupInfoModal = false;
                                    index.searchValue = '';
                                    index.newGroupMembers = [];
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
                                    cdm.forwardCdms();
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
                    <Steps size="small" current={index.currentStep}>
                        <Step title="New members" />
                        <Step title="Customize" />
                    </Steps>
                    {index.currentStep === 0 && (
                        <div className="stepContent">
                            {contacts.list
                                .filter(el => el.groupHash !== groups.current.groupHash)
                                .filter(el => el.publicKey !== null)
                                .filter(el => index.newGroupMembers.indexOf(el.publicKey) > -1)
                                .map(el => (
                                    <div key={`el_${el.groupHash}`} className="newMember">
                                        <div className="fullName">
                                            <Paragraph
                                                ellipsis
                                                style={{
                                                    margin: 0,
                                                    padding: 0,
                                                }}
                                            >
                                                {el.fullName}
                                            </Paragraph>
                                        </div>
                                        <div className="button">
                                            <Button
                                                type={'primary'}
                                                shape="circle"
                                                icon={'check'}
                                                size="small"
                                                onClick={_ => {
                                                    const pkIndex = index.newGroupMembers.indexOf(el.publicKey);
                                                    index.newGroupMembers.splice(pkIndex, 1);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            {index.newGroupMembers.length > 0 && <Divider />}
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
                                        contacts.list.push({
                                            publicKey: e.target.value,
                                            groupHash: groups.createGroupHash([alice.publicKey, e.target.value]),
                                            fullName: `NEW:${e.target.value}`
                                        })
                                    }
                                }}
                            />
                            {groups.current &&
                                contacts.list
                                    .filter(el => el.fullName.toLowerCase().search(index.searchValue.toLowerCase()) > -1)
                                    .filter(el => el.groupHash !== groups.current.groupHash)
                                    .filter(el => el.publicKey !== null)
                                    .filter(el => index.newGroupMembers.indexOf(el.publicKey) === -1)
                                    .map(el => (
                                        <div key={`el_${el.groupHash}`} className="newMember">
                                            <div className="fullName">
                                                <Paragraph
                                                    ellipsis
                                                    style={{
                                                        margin: 0,
                                                        padding: 0,
                                                    }}
                                                >
                                                    {el.fullName}
                                                </Paragraph>
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
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                            ))}
                        </div>
                    )}
                    {index.currentStep === 1 && (
                        <div className="stepContent">
                            <Checkbox
                                onChange={e => {
                                    index.forwardPreviousMessages = e.target.checked
                                }}
                                checked={index.forwardPreviousMessages}
                            >
                                Forward previous messages
                            </Checkbox>
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
                `}</style>
            </div>
        );
    }
}

GroupInfoModal.propTypes = {
    index: PropTypes.object,
};

export default GroupInfoModal