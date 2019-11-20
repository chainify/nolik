import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Input, Icon, Button, AutoComplete } from 'antd';
import mouseTrap from 'react-mousetrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

import PageHeader from '../../components/PageHeader';
import Tag from '../../components/Tag';

const { TextArea } = Input;
const { Option, OptGroup } = AutoComplete;

@inject('chat', 'cdms', 'contacts')
@observer
class ChatNew extends React.Component {
  componentDidMount() {
    const { chat, cdms } = this.props;
    this.props.bindShortcut('meta+enter', () => {
      cdms.sendNewCdm();
    });

    this.props.bindShortcut('esc', () => {
      chat.toggleCompose();
    });
  }

  rendeTitle(title) {
    return <span>{title}</span>;
  }

  rendeOption(contact, publicKey) {
    return <span className="contactOption">{`${contact}, ${publicKey}`}</span>;
  }

  render() {
    const { chat, cdms, contacts } = this.props;
    const inputStyle = {
      border: 'none',
      background: 'transparent',
      margin: '0',
      padding: '0px',
      outline: 'none',
      boxShadow: 'none',
      fontSize: '18px',
      fontWeight: 400,
      lineHeight: '40px',
      height: '40px',
      resize: 'none',
      caretColor: '#2196f3',
      width: '100%',
    };

    const dataSource = [
      {
        title: 'Contacts',
        children:
          contacts.list &&
          contacts.list.filter(
            el =>
              el.contact.toLowerCase().match(chat.inputTo.toLowerCase()) ||
              el.publicKey.toLowerCase().match(chat.inputTo.toLowerCase()),
          ),
      },
    ];

    const options = dataSource.map(group => (
      <OptGroup key={group.title} label={this.rendeTitle(group.title)}>
        {group.children.map(opt => (
          <Option key={opt.publicKey} value={opt.publicKey}>
            {this.rendeOption(opt.contact, opt.publicKey)}
          </Option>
        ))}
      </OptGroup>
    ));

    return (
      <div>
        <div className="main">
          <PageHeader
            transparent
            goBack={
              <button
                type="button"
                shape="circle"
                className="menuButton"
                onClick={chat.toggleCompose}
              >
                <Icon type="close" />
              </button>
            }
            extra={[
              <Button
                type="primary"
                onClick={cdms.sendNewCdm}
                loading={cdms.sendCdmStatus === 'pending'}
              >
                <FontAwesomeIcon
                  icon={faPaperPlane}
                  style={{ marginRight: 10 }}
                />
                Отправить
              </Button>,
            ]}
          />
          <div className="form">
            <div className="formField">
              <div className="formLabel recpients">Кому:</div>
              <div className="formInput">
                {chat.toRecipients.length > 0 && (
                  <div className="inputTags">
                    {chat.toRecipients.map((el, index) => {
                      const mathcedContacts = contacts.list.filter(
                        item => item.publicKey === el,
                      );
                      return (
                        <Tag key={`tag_${el}`} type="to" index={index}>
                          {mathcedContacts.length > 0
                            ? mathcedContacts[0].contact
                            : el === 'FqfKgRAtayyJDYiDDoeHTMcc8cNBx7QUyUD4UHMHT8zE' ? 'Фонд твоя территория' : el}
                        </Tag>
                      );
                    })}
                  </div>
                )}
                <AutoComplete
                  dataSource={options}
                  autoFocus
                  allowClear
                  defaultActiveFirstOption={false}
                  open={chat.inputTo !== ''}
                  onSearch={val => {
                    chat.inputTo = val;
                  }}
                  value={chat.inputTo}
                  style={{ width: '100%' }}
                  backfill
                  onSelect={e => {
                    chat.addTag('toRecipients', e);
                  }}
                  onBlur={e => {
                    chat.addTag('toRecipients', e);
                  }}
                >
                  <Input
                    style={inputStyle}
                    placeholder="Публичный ключ или имя сохраненного контакта"
                    onPressEnter={e => {
                      if (
                        e.target.value === '' ||
                        dataSource[0].children.length > 0
                      ) {
                        return;
                      }
                      chat.addTag('toRecipients', e.target.value);
                    }}
                  />
                </AutoComplete>
              </div>
            </div>
            <div className="formField">
              <div className="formLabel sublect">Тема:</div>
              <div className="formInput subjectInput">
                <TextArea
                  style={inputStyle}
                  autosize
                  className="mousetrap"
                  placeholder={chat.subjectPlaceholder}
                  value={chat.subject}
                  onChange={e => {
                    chat.subject = e.target.value;
                  }}
                />
              </div>
            </div>
            <div className="textArea">
              <TextArea
                placeholder={chat.messagePlaceholder}
                value={chat.message}
                className="mousetrap"
                onChange={e => {
                  chat.message = e.target.value;
                }}
                autosize={{ minRows: 8 }}
                style={inputStyle}
              />
            </div>
          </div>
        </div>
        <style jsx>{`
          .main {
            height: 100vh;
          }

          .list {
            flex-grow: 1;
          }

          .form {
            padding: 4em 2em;
          }

          .formField {
            width: 100%;
            display: flex;
            margin-bottom: 20px;
          }

          .formLabel {
            font-size: 18px;
            line-height: 40px;
            font-weight: 400;
            color: #9e9e9e;
            text-align: left;
          }

          .formLabel.recpients {
            min-width: 60px;
          }

          .formLabel.sublect {
            min-width: 60px;
          }

          .formInput {
            flex-grow: 1;
            border-bottom: 1px solid #eee;
            font-ize: 18px;
            line-height: 24px;
          }

          @media only screen and (max-width: 1023px) {
            .inputTags {
              width: calc(100vw - 4em - 40px);
              padding-top: 9px;
            }
          }

          @media only screen and (min-width: 1024px) {
            .inputTags {
              width: calc(1024px - 4em - 40px);
              padding-top: 9px;
            }
          }

          .subjectInput {
            margin-bottom: 2em;
          }

          .textArea {
            max-height: 400px;
            overflow-y: auto;
          }

          .sendButton {
            width: 60px;
            color: red;
            text-align: right;
          }

          .sendButton button {
            border: none;
            background: #fff;
            padding: 0;
            margin: 0;
            width: 100%;
            text-align: left;
            box-shadow: none;
            outline: 0;
            cursor: pointer;
            height: 32px;
            width: 40px;
            font-size: 20px;
            line-height: 32px;
            text-align: center;
            color: #2196f3;
          }

          .sendButton button:disabled {
            color: #ddd;
            cursor: not-allowed;
          }

          .sendButton button:enabled:hover {
            color: #90caf9;
          }

          .menuButton {
            border: none;
            background: #fff;
            padding: 0;
            margin: 0;
            width: 100%;
            text-align: left;
            box-shadow: none;
            outline: 0;
            cursor: pointer;
            height: 32px;
            width: 40px;
            font-size: 20px;
            line-height: 32px;
            text-align: center;
          }

          .contactOption {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        `}</style>
      </div>
    );
  }
}

ChatNew.propTypes = {
  chat: PropTypes.object,
  cdms: PropTypes.object,
  contacts: PropTypes.object,
  bindShortcut: PropTypes.func,
};

export default mouseTrap(ChatNew);
