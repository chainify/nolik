import React from 'react';
import PropTypes from 'prop-types';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { Input, Button, Modal } from 'antd';
import mouseTrap from 'react-mousetrap';
import { toJS } from 'mobx';

const Search = Input.Search;


@inject('bob', 'contacts')
@observer
class SearchModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const { bob, contacts } = this.props;
        return (
            <div>
                <Modal
                    title="Search Contact"
                    key="searchContact"
                    visible={bob.showAddContactModal}
                    closable
                    onCancel={_ => {
                        bob.showAddContactModal = false;
                        bob.contactPublicKey = '';
                    }}
                    footer={null}
                >
                    <Search
                        placeholder="Enter name or public key"
                        value={bob.contactPublicKey}
                        autoFocus
                        onChange={e => {
                            bob.contactPublicKey = e.target.value;
                        }}
                    />
                    {bob.contactPublicKey && contacts.list && contacts.list.filter(el => {
                        const fullName = [el.firstName, el.lastName].join(' ').trim().toLowerCase();
                        return fullName.search(bob.contactPublicKey) > -1;
                    }).map(el => (
                        <button
                            key={`key_${el.id}`}
                            onClick={_ => {
                                Router.push(`/index?publicKey=${el.publicKey}`, `/pk/${el.publicKey}`);
                                bob.setBob(el.publicKey);
                                bob.showAddContactModal = false;
                                bob.contactPublicKey = '';
                            }}
                            className="contactBtn"
                        >
                            {[el.firstName, el.lastName].join(' ')}
                        </button>
                    ))}
                    {bob.contactPublicKey.length === 44 && (
                        <div>
                            <button
                                key={`key_${bob.contactPublicKey}`}
                                onClick={_ => {
                                    Router.push(`/index?publicKey=${bob.contactPublicKey}`, `/pk/${bob.contactPublicKey}`);
                                    bob.setBob(bob.contactPublicKey);
                                    bob.showAddContactModal = false;
                                    bob.contactPublicKey = '';
                                }}
                                className="contactBtn"
                            >
                                {contacts.list.filter(el => el.publicKey === bob.contactPublicKey).length > 0
                                    ? [
                                        contacts.list.filter(el => el.publicKey === bob.contactPublicKey)[0].firstName,
                                        contacts.list.filter(el => el.publicKey === bob.contactPublicKey)[0].lastName
                                    ].join(' ').trim()
                                    :bob.contactPublicKey
                                }
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