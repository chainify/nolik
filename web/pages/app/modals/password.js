import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Row, Col, Modal, Input, Button } from 'antd';
const { TextArea } = Input;

@inject('app', 'menu')
@observer
class Password extends React.Component {
  render() {
    const { app, menu } = this.props;
    return (
      <div>
        <Modal
          visible={menu.showPasswordModal}
          centered
          title={menu.passwordUnlocked ? 'New password' : 'Please unlock'}
          closable
          destroyOnClose
          onCancel={menu.togglePasswordModal}
          zIndex={1001}
          footer={null}
        >
          {menu.passwordUnlocked ? (
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Input.Password
                  autoFocus
                  value={app.newPassword}
                  placeholder="Your new password"
                  size="large"
                  onPressEnter={() => {
                    app.updatePassword();
                  }}
                  onChange={e => {
                    app.newPassword = e.target.value;
                  }}
                  style={{ marginBottom: 10 }}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Input.Password
                  value={app.passwordRepeat}
                  placeholder="Repeat new password"
                  size="large"
                  onPressEnter={() => {
                    app.updatePassword();
                  }}
                  onChange={e => {
                    app.passwordRepeat = e.target.value;
                  }}
                  style={{ marginBottom: 10 }}
                />
              </Col>
              <Col xs={24} sm={24}>
                <TextArea
                  placeholder="Password hint (optional but recommended)"
                  onChange={e => {
                    app.passwordHint = e.target.value;
                  }}
                  value={app.passwordHint}
                  style={{ marginBottom: 10 }}
                />
              </Col>
              <Col xs={24} sm={{ span: 8, offset: 16 }}>
                <Button
                  key="backupSubmit"
                  type="primary"
                  size="large"
                  block
                  onClick={() => {
                    app.updatePassword();
                  }}
                  disabled={
                    app.newPassword === '' ||
                    app.newPassword !== app.passwordRepeat
                  }
                >
                  Update
                </Button>
              </Col>
            </Row>
          ) : (
            <Row gutter={16}>
              <Col xs={24} sm={16}>
                <Input.Password
                  autoFocus
                  placeholder="Your old password"
                  value={app.password}
                  size="large"
                  onPressEnter={() => {
                    app.unlockPassword();
                  }}
                  onChange={e => {
                    app.password = e.target.value;
                  }}
                  style={{ marginBottom: 10 }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  key="unlockSubmit"
                  type="primary"
                  block
                  size="large"
                  onClick={() => {
                    app.unlockPassword();
                  }}
                  disabled={app.password === ''}
                >
                  Unlock
                </Button>
              </Col>
            </Row>
          )}
        </Modal>
        <style jsx>{`
          .socialIcon {
            border-radius: 10px;
            display: inline-block;
            overflow: hidden;
            margin-left: 2px;
            margin-right: 2px;
            opacity: 0.8;
          }

          .socialIcon:hover {
            opacity: 1;
            cursor: pointer;
          }

          .copyIcon {
            width: 64px;
            height: 64px;
            border: none;
            background: #eee;
            padding: 0;
            margin: 0;
            box-shadow: none;
            outline: 0;
            color: #999;
            font-size: 32px;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }
}

Password.propTypes = {
  app: PropTypes.object,
  menu: PropTypes.object,
};

export default Password;
