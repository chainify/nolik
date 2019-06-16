import React from 'react';
import PropTypes from 'prop-types';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { Input, Button, Modal } from 'antd';
import mouseTrap from 'react-mousetrap';
import { toJS } from 'mobx';

const Search = Input.Search;


@inject('alice', 'index', 'contacts', 'groups')
@observer
class SearchModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const { alice, index, contacts, groups } = this.props;
        return (
            <div>
                <Modal
                    title="Search Contact"
                    key="searchContact"
                    visible={index.showAddContactModal}
                    closable
                    onCancel={_ => {
                        index.showAddContactModal = false;
                        contacts.searchValue = '';
                    }}
                    footer={null}
                >
                    <Search
                        placeholder="Enter name or public key"
                        value={contacts.searchValue}
                        autoFocus
                        onChange={e => {
                            contacts.searchValue = e.target.value;
                        }}
                    />
                    {groups.list.filter(el => el.fullName.toLowerCase().search(contacts.searchValue) > -1)
                        .map(el => (
                            <button
                                key={`key_${el.groupHash}`}
                                onClick={_ => {
                                    // Router.push(`/index?publicKey=${el.publicKey}`, `/pk/${el.publicKey}`);
                                    // bob.setBob(el.publicKey);
                                    // bob.showAddContactModal = false;
                                    // bob.contactPublicKey = '';
                                }}
                                className="contactBtn"
                            >
                                {el.fullName}
                            </button>
                        ))}
                    {contacts.searchValue.length === 44 && (
                        <div>
                            <button
                                key={`key_${contacts.searchValue}`}
                                onClick={_ => {
                                    const groupHash = groups.createGroupHash([alice.publicKey, contacts.searchValue]);
                                    groups.newGroupMembers = [{
                                        publicKey: contacts.searchValue,
                                        lastActive: null,
                                    }];
                                    Router.push(`/index?groupHash=${groupHash}`, `/gr/${groupHash}`);
                                    index.showAddContactModal = false;
                                    groups.setGroup(groupHash);
                                    contacts.searchValue = '';
                                }}
                                className="contactBtn"
                            >
                                {contacts.searchValue}
                                {/* {contacts.list.filter(el => el.publicKey === bob.contactPublicKey).length > 0
                                    ? [
                                        contacts.list.filter(el => el.publicKey === bob.contactPublicKey)[0].firstName,
                                        contacts.list.filter(el => el.publicKey === bob.contactPublicKey)[0].lastName
                                    ].join(' ').trim()
                                    :bob.contactPublicKey
                                } */}
                            </button>
                        </div>
                    )}

                </Modal>
                <style jsx>{`
                    p.title {
                        margin: 0;
                        color: #999;
                    }

                    p.contactInfo {
                        color: #333;
                    }

                    button.contactBtn {
                        width: 100%;
                        padding: 1em;
                        border: 0px;
                        background: transparent;
                        text-align: left;
                        cursor: pointer;
                        text-decoration: underline;
                        color: blue;
                    }

                    button.contactBtn:hover {
                        color: #ddd;
                    }
                `}</style>
            </div>
        );
    }
}

SearchModal.propTypes = {
    index: PropTypes.object,
};

export default withRouter(mouseTrap(SearchModal))