import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Row, Col, Modal, Input, Button, Icon } from 'antd';

@inject('app', 'menu')
@observer
class DropAccounts extends React.Component {
  render() {
    const { app, menu } = this.props;
    return (
      <div>
        <Modal
          visible={menu.showDropAccountsModal}
          centered
          title={
            menu.dropAccountsUnlocked
              ? 'Confirm with password'
              : 'Drop all accounts'
          }
          closable
          destroyOnClose
          onCancel={menu.toggleDropAccountsModal}
          zIndex={1001}
          footer={null}
        >
          {menu.dropAccountsUnlocked ? (
            <Row gutter={16}>
              <Col xs={24} sm={16}>
                <Input.Password
                  autoFocus
                  value={app.password}
                  size="large"
                  onPressEnter={() => {
                    app.dropAccounts();
                  }}
                  onChange={e => {
                    app.password = e.target.value;
                  }}
                  style={{ marginBottom: 10 }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  key="backupSubmit"
                  type="danger"
                  size="large"
                  block
                  onClick={() => {
                    app.dropAccounts();
                  }}
                  disabled={app.password === ''}
                >
                  Drop
                </Button>
              </Col>
            </Row>
          ) : (
            <div>
              <Row>
                <Col>
                  <p>
                    In order to drop accounts please type&nbsp;
                    <b>Drop all accounts</b>.&nbsp;IMPORTANT! Make sure to
                    &nbsp;save your backup phrases!
                  </p>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={16}>
                  <Input
                    autoFocus
                    placeholder={`Type "Drop all accounts" here`}
                    value={menu.dropVerification}
                    size="large"
                    onPressEnter={() => {
                      menu.dropSubmit();
                    }}
                    onChange={e => {
                      menu.dropVerification = e.target.value;
                    }}
                    style={{ marginBottom: 10 }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Button
                    key="dropSubmit"
                    type="primary"
                    block
                    size="large"
                    onClick={() => {
                      menu.dropSubmit();
                    }}
                    disabled={
                      menu.dropVerification === '' ||
                      menu.dropVerification !== 'Drop all accounts'
                    }
                  >
                    Confirm
                  </Button>
                </Col>
              </Row>
            </div>
          )}
        </Modal>
        <style jsx>{``}</style>
      </div>
    );
  }
}

DropAccounts.propTypes = {
  app: PropTypes.object,
  menu: PropTypes.object,
};

export default DropAccounts;
