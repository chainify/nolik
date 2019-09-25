import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Row, Col, Modal, Input, Button } from 'antd';
import Router from 'next/router';

@inject('app')
@observer
class Password extends React.Component {
  render() {
    const { app } = this.props;
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
};

export default Password;
