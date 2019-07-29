import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import Wrapper from '../components/Wrapper';
import Group from '../components/Group';
import Cdm from '../components/Cdm';
import Skeleton from '../components/Skeleton';
import { Row, Col, Input, Button, Icon, Dropdown, Menu, PageHeader, Divider } from 'antd';
const { TextArea } = Input;
import mouseTrap from 'react-mousetrap';
// import { toJS } from 'mobx';

import ContactInfoModal from '../modals/ContactInfoModal';
import GroupInfoModal from '../modals/GroupInfoModal';
import NewGroupMembersModal from '../modals/NewGroupMembersModal';


@inject('alice', 'index', 'cdm', 'contacts', 'groups')
@observer
class Index extends React.Component {
    constructor(props) {
        super(props);
        const { alice, groups, router, cdm, contacts } = this.props;
        
        this.authPeriodicChecker = setInterval(() => {
            alice.authCheck();
        }, 200);


        autorun(() => {
            if (alice.publicKey && alice.updateHeartbeatStatus === 'init') {
                alice.updateHeartbeat();
            }
        });

        this.aliceHeartbeatPeriodic = autorun(() => {
            if (alice.updateHeartbeatStatus === 'success') {
                alice.updateHeartbeat();
            }
        });

        autorun(() => {
            if (
                cdm.lastCdmHash === null && 
                groups.list === null
            ) {
                groups.getList();
            }
        });

        autorun(() => {
            if (
                groups.list &&
                cdm.lastCdmHash && 
                groups.list.slice(0, 3).map(el => el.lastCdm && el.lastCdm.attachmentHash).indexOf(cdm.lastCdmHash) < 0
            ) {
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
        const { cdm } = this.props;
        this.props.bindShortcut('meta+enter', () => {
            if (cdm.textareaFocused) {
                cdm.message = cdm.message + '\r\n';
            }
        });

        this.props.bindShortcut('shift+enter', () => {
            if (cdm.textareaFocused) {
                cdm.message = cdm.message + '\r\n';
            }
        });

        this.props.bindShortcut('enter', () => {
            if (cdm.textareaFocused) {
                if (cdm.message.trim() !== "") {
                    cdm.sendCdm();
                }
            }
        });
    }

    componentWillUnmount() {
        const { groups } = this.props;
        groups.list = null;
        this.aliceHeartbeatPeriodic();
        clearInterval(this.authPeriodicChecker);
    }

    render() {
        const { groups, cdm, index, alice, contacts } = this.props;
        const chatDropdownMenu = (
            <Menu
                onClick={e => {
                    if (e.key === '0') {
                        contacts.groupFullName = groups.current.fullName;
                        index.showGroupInfoModal = true;
                    }
                    if (e.key === '1') {
                        index.showNewGroupMembersModal = true;
                    }
                }}
            >
                <Menu.Item key="0">
                    <Icon type="user" /> Group info
                </Menu.Item>
                <Menu.Item key="1">
                    <Icon type="usergroup-add" /> Add group members
                </Menu.Item>
                </Menu>
        );

        return (
            <Wrapper>
                <ContactInfoModal />
                <GroupInfoModal />
                <NewGroupMembersModal />
                <Row>
                    <Col xs={10} md={8}>
                        <div className="groups">
                            {groups.list && (
                                <div className="groupsHeader">
                                    <PageHeader
                                        onBack={() => {
                                            groups.resetGroup();
                                            alice.publicKey = null;
                                        }}
                                        key="groupsHeader"
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
                                                            groups.searchedList = null;
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
                                                    if (groups.searchValue === '') {
                                                        groups.searchedList = null;
                                                    } else {
                                                        if (groups.list) {
                                                            groups.searchedList = groups.list
                                                                .filter(el => el.fullName.toLowerCase().search(groups.searchValue.toLowerCase()) > -1);
                                                        }
                                                        
                                                        if (groups.searchedList.length === 0 && groups.searchValue.length == 44) {
                                                            const groupHash = groups.createGroupHash([alice.publicKey, groups.searchValue])
                                                            contacts.getContact(groups.searchValue)
                                                                .then(fullName => {
                                                                    groups.searchedList = [{
                                                                        members: [groups.searchValue, alice.publicKey],
                                                                        index: groups.list.length,
                                                                        groupHash: groupHash,
                                                                        fullName: fullName || groups.searchValue,
                                                                        totalCdms: 0,
                                                                        readCdms: 0,
                                                                        lastCdm: null,
                                                                    }];
                                                                });
                                                        }
                                                    }  
                                                }}
                                            />
                                        ]}
                                        style={{
                                            borderBottom: '1px solid #ddd',
                                            background: '#eee',
                                        }}
                                    />
                                </div>
                            )}
                            <div className="groupsBody">
                                {groups.list === null && index.fakeHeaders.map(item => (
                                    <Skeleton rows={2} key={`header_${item}`} />
                                ))}
                                {groups.searchedList && groups.searchedList.map(item => (
                                    <Group item={item} key={`header_${item.index}`} />
                                ))}
                                {groups.searchedList && <Divider />}
                                {groups.searchedList === null && groups.list && groups.list.map(item => (
                                    <Group item={item} key={`header_${item.index}`} />
                                ))}
                            </div>
                        </div>
                    </Col>
                    <Col xs={14} md={16}>
                        {groups.list && groups.current === null && <div className={`cdm empty`} />}
                        {groups.list === null && <div className={`cdm loading`}>{groups.initLoadingStatus}</div>}
                        {groups.list && groups.current  && (
                            <div className="cdm">
                                <PageHeader
                                    onBack={() => groups.resetGroup()}
                                    title={groups.fullName}
                                    key="chatHeader"
                                    subTitle={groups.current.usersOnline === 1 && <span className="isOnline">Online</span>}
                                    extra={groups.list.filter(el => el.groupHash === groups.current.groupHash && el.index === 0).length === 0 && [
                                        <Dropdown
                                            overlay={chatDropdownMenu}
                                            trigger={['click']}
                                            key="chatDropdownMenu"
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
                                        autosize={{ "minRows" : 1, "maxRows" : 8 }}
                                        placeholder={`Type your message here`}
                                        onChange={e => {
                                            cdm.message = e.target.value;
                                        }}
                                        onPressEnter={e => {
                                            e.preventDefault();
                                        }}
                                        onFocus={_ => {
                                            cdm.textareaFocused = true;
                                        }}
                                        onBlur={_ => {
                                            cdm.textareaFocused = false;
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
                    .groups {
                        height: 100vh;
                        overflow-y: auto;
                        background: #fff;
                        border-right: 1px solid #ddd;
                        display: flex;
                        flex-direction: column;
                    }

                    .groupsHeader {
                        flex-basis: 70px;
                    }
                    
                    .groupsBody {
                        flex-grow: 1;
                        overflow-y: auto;
                        background: #fff;
                        padding-bottom: 2em;
                    }

                    .cdm {
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        position: relative;
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
                        position: absolute;
                        left: 0px;
                        top: 58px;
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
                        padding: 1em 2em;
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

                    .isOnline {
                        color: #4caf50;
                        border: 1px solid #4caf50;
                        padding: 0.2em;
                        font-size: 0.8em;
                        border-radius: 4px;
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