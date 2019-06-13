import React from 'react';
import PropTypes from 'prop-types';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS, action } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import Wrapper from '../components/Wrapper';
import Header from '../components/Header';
import Cdm from '../components/Cdm';
import Skeleton from '../components/Skeleton';
import { Row, Col, Input, Button, Icon, Modal, Dropdown, Menu, Divider, PageHeader, Typography } from 'antd';
const { TextArea } = Input;
import mouseTrap from 'react-mousetrap';

import SearchModal from '../modals/SearchModal';
const { Paragraph } = Typography;
const paragrapStyle = {
    margin: 0,
    padding: 0,
};


@inject('alice', 'bob', 'index', 'cdm', 'contacts')
@observer
class Index extends React.Component {

    authPeriodicChecker = null;
    contactsPeriodicChecker = null;
    constructor(props) {
        super(props);
        const { alice, bob, router, cdm } = this.props;
        
        this.authPeriodicChecker = setInterval(() => {
            alice.authCheck();
        }, 200);
        
        autorun(() => {
            if (router.query.publicKey) {
                bob.setBob(router.query.publicKey);
            }
        });
        
        this.contactsPeriodicChecker = autorun(() => {
            if (bob.getListStatus === 'success') {
                bob.getList();
            }
        });

        autorun(() => {
            if (bob.list.length > 0 && bob.publicKey && bob.fullName === null) {
                bob.setFullName();
                cdm.getList();
            }
        });
    }

    componentDidMount() {
        const { cdm, bob } = this.props;
        
        if (bob.getListStatus === 'init') {
            bob.getList();
        }
        
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
        const { bob, cdm, index, alice } = this.props;
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
                        bob.showContactInfoModal = true;
                        const currentBob = bob.list.filter(el => el.accounts[0].publicKey === bob.publicKey)[0];
                        bob.firstNameEdit = currentBob.accounts[0].firstName;
                        bob.lastNameEdit = currentBob.accounts[0].lastName;
                    }
                    if (e.key === '1') {
                        bob.showAddGroupModal = true;
                    }
                }}
            >
                <Menu.Item key="0">
                    <Icon type="user" /> Contact info
                </Menu.Item>
                <Menu.Item key="1">
                    <Icon type="usergroup-add" /> Add group members
                </Menu.Item>
                {/* <Menu.Divider /> */}
                </Menu>
        );

        return (
            <Wrapper>
                <Modal
                    title="User info"
                    key="userInfo"
                    visible={bob.showContactInfoModal}
                    closable={true}
                    onCancel={_ => {
                        bob.showContactInfoModal = false;
                    }}
                    footer={[
                        <Button
                            key="cancel"
                            onClick={_ => {
                                bob.showContactEditModal = true;
                            }}
                        >
                            Edit
                        </Button>,
                    ]}
                >
                    <p className="title">Address</p>
                    <p className="contactInfo">
                        {`https://nolik.im/pk/${bob.publicKey}`}
                    </p>
                    <Divider />
                    <p className="title">Full name</p>
                    <p className="contactInfo">
                        {bob.publicKey === bob.fullName ? '' : bob.fullName}
                    </p>
                </Modal>
                <Modal
                    title="Update user info"
                    key="userInfoEdit"
                    visible={bob.showContactEditModal}
                    closable={true}
                    onCancel={_ => {
                        bob.showContactEditModal = false;
                    }}
                    footer={[
                        <Button
                            key="cancelUserInfo"
                            onClick={_ => {
                                bob.showContactEditModal = false;
                            }}
                        >
                            Cancel
                        </Button>,
                        <Button
                            key="saveUserInfo"
                            type="primary"
                            onClick={_ => {
                                bob.saveUserInfo();
                            }}
                        >
                            Save
                        </Button>,
                    ]}
                >
                    <p className="title">First Name</p>
                    <Input
                        placeholder="Enter first name"
                        value={bob.firstNameEdit}
                        onChange={e => {
                            bob.firstNameEdit = e.target.value;
                        }}
                    />
                    <p className="title">&nbsp;</p>
                    <p className="title">Last Name</p>
                    <Input
                        placeholder="Enter last name"
                        value={bob.lastNameEdit}
                        onChange={e => {
                            bob.lastNameEdit = e.target.value;
                        }}
                    />
                </Modal>
                <Modal
                    title="Add members to group"
                    key="addMembers"
                    visible={bob.showAddGroupModal}
                    closable={false}
                    footer={[
                        <Button
                            key="cancelAddMembers"
                            onClick={_ => {
                                bob.showAddGroupModal = false;
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
                <SearchModal />
                <Row>
                    <Col xs={bob.publicKey === null ? 24 : 0} sm={10} md={8}>
                        <div className="contacts">
                            {bob.list.length > 0 && (
                                <PageHeader
                                    onBack={() => {
                                        bob.reset();
                                        alice.publicKey = null;
                                    }}
                                    key="contactsHeader"
                                    backIcon={<Icon type="poweroff" />}
                                    extra={[
                                        <Button
                                            key="settingBtn"
                                            onClick={_ => {
                                                // bob.showAddContactModal = true;
                                            }}
                                        >
                                            <Icon type="setting" />
                                        </Button>,
                                        <Button
                                            key="addContactBtn"
                                            onClick={_ => {
                                                bob.showAddContactModal = true;
                                            }}
                                        >
                                            <Icon type="user-add" />
                                        </Button>
                                    ]}
                                    style={{
                                        borderBottom: '1px solid #ddd',
                                        background: '#eee',
                                    }}
                                />
                            )}
                            {bob.list.length === 0 && index.fakeHeaders.map(item => (
                                <Skeleton rows={2} key={`header_${item}`} />
                            ))}
                            {bob.newBob && (
                                <Header item={bob.newBob} key={`header_${bob.newBob.index}`} />
                            )}
                            {bob.list.map(item => (
                                <Header item={item} key={`header_${item.index}`} />
                            ))}
                        </div>
                    </Col>
                    <Col xs={bob.publicKey === null ? 0 : 24} sm={14} md={16}>
                        {bob.publicKey === null && <div className={`cdm empty`} />}
                        {bob.publicKey && bob.list.length === 0 && <div className={`cdm loading`}>Loading...</div>}
                        {bob.list.length > 0 && bob.publicKey  && (
                            <div className="cdm">
                                <PageHeader
                                    onBack={() => bob.reset()}
                                    title={
                                        <span className="pageHeader">
                                            {bob.fullName}
                                        </span>
                                    }
                                    key="chatHeader"
                                    subTitle=""
                                    extra={bob.list.filter(el => el.accounts[0].publicKey === bob.publicKey && el.index === 0).length === 0 && [
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
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
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
                `}</style>
            </Wrapper>
        );
    }
}

Index.propTypes = {
    index: PropTypes.object,
};

export default withRouter(mouseTrap(Index))