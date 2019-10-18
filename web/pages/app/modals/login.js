import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Row, Col, Modal, Input, Button, notification } from 'antd';
import Router from 'next/router';

@inject('app', 'notifiers')
@observer
class Password extends React.Component {
  render() {
    const { app, notifiers } = this.props;
    return (
      <div>
        <Modal
          title="Please login"
          visible={app.showPasswordModal}
          centered
          closable
          destroyOnClose
          onCancel={() => {
            app.togglePasswordModal();
            Router.push('/');
          }}
          footer={null}
        >
          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Input.Password
                autoFocus
                size="large"
                placeholder="Your password"
                value={app.password}
                onPressEnter={() => {
                  app.logIn();
                }}
                onChange={e => {
                  app.password = e.target.value;
                }}
                style={{ marginBottom: 10 }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Button
                key="passwordSubmit"
                type="primary"
                size="large"
                block
                onClick={() => {
                  app.logIn();
                }}
                disabled={app.password === ''}
              >
                Submit
              </Button>
            </Col>
          </Row>
          <Row>
            <Col xs={24} sm={8}>
              <Button
                key="passwordHint"
                type="link"
                onClick={() => {
                  app.getPasswordHint().then(hint => {
                    notifiers.passwordHint(hint);
                  });
                }}
                style={{ paddingLeft: 0, marginLeft: 0 }}
              >
                Show password hint
              </Button>
            </Col>
            <Col xs={24} sm={8}>
              <Button
                key="passwordForgot"
                type="link"
                onClick={() => {
                  notifiers.passwordForgot();
                }}
              >
                Forgot password
              </Button>
            </Col>
          </Row>
        </Modal>
        <style jsx>{``}</style>
      </div>
    );
  }
}

Password.propTypes = {
  app: PropTypes.object,
  notifiers: PropTypes.object,
};

export default Password;
