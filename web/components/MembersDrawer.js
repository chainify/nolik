import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Button, Icon, Drawer, Tabs, Divider } from 'antd';
import { keyPair } from '@waves/ts-lib-crypto';

const { TabPane } = Tabs;

@inject('chat', 'contacts', 'cdms', 'threads', 'app')
@observer
class MembersDrawer extends React.Component {
  render() {
    const { chat, contacts, cdms, threads, app } = this.props;
    return (
      <div className="container">
        <Drawer
          // title="Thread members"
          placement="top"
          closable={false}
          onClose={chat.clearNewMembers}
          visible={chat.membersDrawerKey !== null}
          getContainer={false}
          style={{
            position: 'absolute',
          }}
          height={400}
        >
          <Tabs
            activeKey={chat.membersDrawerKey}
            tabBarExtraContent={
              <Button
                icon="close"
                shape="circle"
                onClick={() => {
                  chat.toggleShowMembers(null);
                }}
              />
            }
            onChange={key => {
              chat.toggleShowMembers(key);
            }}
          >
            <TabPane
              tab={
                <span>
                  <Icon type="plus" />
                  &nbsp;Add member
                </span>
              }
              key="addMember"
            >
              <div className="contacts">
                {contacts.pinned && contacts.pinned.length === 0 && (
                  <div>
                    <p>
                      No pinned contacts.&nbsp;
                      <Button
                        type="link"
                        onClick={() => {
                          chat.toggleContacts();
                        }}
                      >
                        Add some
                      </Button>
                    </p>
                  </div>
                )}
                {contacts.pinned &&
                  contacts.pinned.map(el => (
                    <div key={`contact_${el.publicKey}`} className="contactRow">
                      <div className="contact">
                        {el.contact}&nbsp;
                        {`<${el.publicKey}>`}
                      </div>
                      <div className="contactSelected">
                        <Button
                          shape="circle"
                          icon={
                            chat.newMembers.indexOf(el.publicKey) < 0
                              ? 'plus'
                              : 'check'
                          }
                          type={
                            chat.newMembers.indexOf(el.publicKey) < 0
                              ? 'default'
                              : 'primary'
                          }
                          disabled={
                            (threads.current &&
                              threads.current.members.indexOf(el.publicKey) >
                                -1) ||
                            cdms.sendCdmStatus === 'pending'
                          }
                          onClick={() => {
                            chat.toggleNewMember(el.publicKey);
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
              <Divider />
              <Button
                type="primary"
                disabled={chat.newMembers.length === 0}
                onClick={() => {
                  cdms.sendAddMembersCdm();
                }}
                loading={cdms.sendCdmStatus === 'pending'}
              >
                Add members
              </Button>
            </TabPane>
            <TabPane tab="Members" key="members">
              <div className="members">
                <p className="member" key="member_you">
                  1. You {`<${keyPair(app.seed).publicKey}>`}
                </p>
                {threads.current &&
                  chat.onlineMembers &&
                  contacts.list &&
                  threads.current.members.map((el, index) => (
                    <p key={`member_${el}`} className="member">
                      {index + 2}.&nbsp;
                      {chat.onlineMembers.filter(item => item === el).length >
                        0 && <span className="online">ONLINE</span>}
                      {chat.onlineMembers.filter(item => item === el).length ===
                        0 && <span className="offline">OFFLINE</span>}
                      {`${contacts.list.filter(item => item.publicKey === el)
                        .length > 0 &&
                        contacts.list.filter(item => item.publicKey === el)[0]
                          .contact}
                        <${el}>`}
                    </p>
                  ))}
              </div>
            </TabPane>
          </Tabs>
        </Drawer>
        <style jsx>{`
          .container {}

          .contacts {
            height: 210px;
            overflow-y: auto;
          }

          .members {
            height: 280px;
            overflow-y: auto;
          }

          .member,
          .contact {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .contactRow {
            display: flex;
            padding: 0.2em 0;
          }

          .contactRow:hover {
            background: #fafafa;
          }

          .contact {
            flex: 1;
            line-height: 32px;
          }

          .contactSelected {
            width: 60px;
            height: 32px;
            text-align: right;
            color: #999;
          }

          .online {
            display: inline-block;
            color: #fff;
            background: #43a047;
            padding: 0 0.2em;
            border-radius: 4px;
            margin-right: 4px;
          }

          .offline {
            display: inline-block;
            color: #fff;
            background: #ef5350;
            padding: 0 0.2em;
            border-radius: 4px;
            margin-right: 4px;
          }
        `}</style>
      </div>
    );
  }
}

MembersDrawer.propTypes = {
  chat: PropTypes.object,
  contacts: PropTypes.object,
  cdms: PropTypes.object,
  threads: PropTypes.object,
  app: PropTypes.object,
};

export default MembersDrawer;
