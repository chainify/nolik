import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Row, Col, Modal, Input, Button } from 'antd';

@inject('app')
@observer
class Switch extends React.Component {
  render() {
    const { app } = this.props;
    return (
      <div>
        <Modal
          title="Please verify"
          visible={app.switchTo !== null}
          centered
          closable
          destroyOnClose
          onCancel={app.clearSwitch}
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
                  app.switchAccount();
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
                  app.switchAccount();
                }}
                disabled={app.password === ''}
              >
                Switch account
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

Switch.propTypes = {
  app: PropTypes.object,
};

export default Switch;
