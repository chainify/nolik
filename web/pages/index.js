import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import Wrapper from '../components/Wrapper';
import Group from '../components/Group';
import Cdm from '../components/Cdm';
import Skeleton from '../components/Skeleton';
import { Row, Col, Input, Button, Icon, Modal, Dropdown, Menu, Divider, PageHeader, Typography } from 'antd';
const { TextArea } = Input;
import mouseTrap from 'react-mousetrap';

import ContactInfoModal from '../modals/ContactInfoModal';
// import SearchModal from '../modals/SearchModal';
// import ContactEditModal from '../modals/ContactEditModal';

const Search = Input.Search;
const { Paragraph } = Typography;
const paragrapStyle = {
    margin: 0,
    padding: 0,
};


@inject('alice', 'index', 'cdm', 'contacts', 'groups')
@observer
class Index extends React.Component {

    authPeriodicChecker = null;
    contactsPeriodicChecker = null;
    constructor(props) {
        super(props);
        const { alice, groups, router, cdm } = this.props;
        
        this.authPeriodicChecker = setInterval(() => {
            alice.authCheck();
        }, 200);
        
        // autorun(() => {
        //     if (router.query.groupHash) {
        //         groups.setGroup(router.query.groupHash);
        //     }
        // });


        autorun(() => {
            if (alice.publicKey && groups.list === null) {
                groups.getList();
            }
        });
        
        this.contactsPeriodicChecker = autorun(() => {
            if (groups.getListStatus === 'success') {
                groups.getList();
            }
        });

        autorun(() => {
            if (
                groups.list &&
                groups.current &&
                cdm.list === null
            ) {
                cdm.getList();
            }
        });
    }

    componentDidMount() {
        const { cdm, groups, alice } = this.props;

        // if (alice.publicKey && groups.getListStatus === 'init') {
        //     groups.getList();
        // }
        
        this.props.bindShortcut('meta+enter', () => {
            if (cdm.message.trim() !== "") {
                cdm.sendCdm();
            }
        });
    }

    componentWillUnmount() {
        this.contactsPeriodicChecker();
        clearInterval(this.authPeriodicChecker);
    }

    render() {
        const { groups, cdm, index, alice, contacts } = this.props;
        // const contactsDropdownMenu = (
        //     <Menu
        //         onClick={e => {
        //             if (e.key === '0') {
        //                 bob.showAddContactModal = true;
        //             }
        //             // if (e.key === '1') {
        //             //     bob.showAddGroupModal = true;
        //             // }
        //         }}
        //     >
        //         <Menu.Item key="0">
        //             <Icon type="search" /> Search contacts
        //         </Menu.Item>
        //         {/* <Menu.Divider /> */}
        //         </Menu>
        // );
        const chatDropdownMenu = (
            <Menu
                onClick={e => {
                    if (e.key === '0') {
                        contacts.fullNameEdit = groups.current.fullName;
                        index.showContactInfoModal = true;
                        // const currentBob = bob.list.filter(el => el.accounts[0].publicKey === bob.publicKey)[0];
                        // bob.firstNameEdit = currentBob.accounts[0].firstName;
                        // bob.lastNameEdit = currentBob.accounts[0].lastName;
                    }
                    if (e.key === '1') {
                        index.showAddGroupModal = true;
                    }
                }}
            >
                <Menu.Item key="0">
                    <Icon type="user" /> Contact info
                </Menu.Item>
                <Menu.Item key="1" disabled>
                    <Icon type="usergroup-add" /> Add group members
                </Menu.Item>
                {/* <Menu.Divider /> */}
                </Menu>
        );

        return (
            <Wrapper>
                <Modal
                    title="Add members to group"
                    key="addMembers"
                    visible={index.showAddGroupModal}
                    closable={false}
                    footer={[
                        <Button
                            key="cancelAddMembers"
                            onClick={_ => {
                                index.showAddGroupModal = false;
                            }}
                        >
                            Cancel
                        </Button>,
                        <Button
                            key="addMembersSubmit"
                            type="primary"
                            loading={false}
                            onClick={_ => {

                            }}
                        >
                            Add
                        </Button>,
                    ]}
                >
                    <p>Bla bla ...</p>
                    <p>Bla bla ...</p>
                    <p>Bla bla ...</p>
                </Modal>
                <ContactInfoModal />
                <Row>
                    <Col sm={10} md={8}>
                        <div className="contacts">
                            {groups.list && (
                                <PageHeader
                                    onBack={() => {
                                        groups.resetGroup();
                                        alice.publicKey = null;
                                    }}
                                    key="contactsHeader"
                                    backIcon={<Icon type="poweroff" />}
                                    extra={[
                                        <Input
                                            placeholder="Public key / Contact"
                                            prefix={<Icon type="search" style={{ color: '#ddd' }} />}
                                            suffix={groups.searchValue.length > 0 && (
                                                <button
                                                    className="clearSearch"
                                                    onClick={_ => {
                                                        groups.searchValue = '';
                                                    }}
                                                >
                                                    <Icon type="close-circle" theme="filled" />
                                                </button>
                                            )}
                                            key="groupsSearchInput"
                                            size="small"
                                            value={groups.searchValue}
                                            onChange={e => {
                                                groups.searchValue = e.target.value;
                                                groups.list = groups.list
                                                    .filter(el => el.fullName.toLowerCase().search(groups.searchValue.toLowerCase()) > -1);
                                            }}
                                        />
                                    ]}
                                    style={{
                                        borderBottom: '1px solid #ddd',
                                        background: '#eee',
                                    }}
                                />
                            )}
                            {groups.list === null && index.fakeHeaders.map(item => (
                                <Skeleton rows={2} key={`header_${item}`} />
                            ))}
                            {groups.list && groups.list.map(item => (
                                <Group item={item} key={`header_${item.index}`} />
                            ))}
                        </div>
                    </Col>
                    <Col sm={14} md={16}>
                        {groups.current === null && <div className={`cdm empty`} />}
                        {groups.list === null && <div className={`cdm loading`}>Loading...</div>}
                        {groups.list && groups.current  && (
                            <div className="cdm">
                                <PageHeader
                                    onBack={() => groups.resetGroup()}
                                    title={groups.fullName}
                                    key="chatHeader"
                                    subTitle=""
                                    extra={groups.list.filter(el => el.groupHash === groups.current.groupHash && el.index === 0).length === 0 && [
                                        <Dropdown
                                            overlay={chatDropdownMenu}
                                            trigger={['click']}
                                            key="asd"
                                        >   
                                            <Button>
                                                <Icon type="down" />
                                            </Button>
                                        </Dropdown>
                                    ]}
                                    style={{
                                        borderBottom: '1px solid #ddd',
                                        background: '#eee',
                                    }}
                                />
                                {cdm.getListStatus === 'fetching' && <div className="cdmLoading" />}
                                <Cdm />
                                <div className="actions">
                                    <TextArea
                                        value={cdm.message}
                                        ref={elem => this.tArea = elem}
                                        autosize={{ "minRows" : 2, "maxRows" : 20 }}
                                        placeholder={`Type your message here. ⌘ / ❖ + Enter to send message`}
                                        onChange={e => {
                                            cdm.message = e.target.value;
                                        }}
                                        className="mousetrap"
                                        style={{
                                            border: '1px solid #ddd',
                                            background: '#fff',
                                            borderRadius: 10,
                                            margin: 0,
                                            padding: 10,
                                            outline: 'none',
                                            boxShadow: 'none',
                                            fontSize: '1.2em',
                                            resize: 'none',
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </Col>
                </Row>
                <style jsx>{`
                    .contacts {
                        height: 100vh;
                        overflow-y: auto;
                        background: #fff;
                        border-right: 1px solid #ddd;
                    }

                    .contacts .noContacts {
                        line-height: 50px;
                        text-align: center;
                        color: #fff;
                    }

                    .cdm {
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }

                    .cdm.empty {
                        height: 100vh;
                        background: #f2f2f2 url(./../static/empty.svg) no-repeat center center;
                        background-size: 20%;
                    }

                    .cdm.loading {
                        height: 100vh;
                        background: #eee;
                        padding: 2em;
                        color: #999;
                    }

                    .pageHeader {
                        overflow-x: hidden;
                    }

                    .cdmLoading {
                        width: 100%;
                        height: 6px;
                        background-image: 
                        repeating-linear-gradient(
                            90deg,
                            #64b5f6,
                            #90caf9
                        );
                        background-position: 0px 0px;
                        animation: move 1s linear infinite;
                        display: block;
                    }

                    @keyframes move {
                        from {
                          background-position: 0px 0px;
                        }
                        to {
                          background-position: 1000px 0px;
                        }
                    }

                    .actions {
                        background: #eee;
                        padding: 1em 4em;
                        border-top: 1px solid #ddd;
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

                    .messageMD {
                        color: red;!
                    }
                `}</style>
            </Wrapper>
        );
    }
}

Index.propTypes = {
    index: PropTypes.object,
};

export default withRouter(mouseTrap(Index))