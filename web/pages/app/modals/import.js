import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Row, Col, Modal, Input, Button, Icon } from 'antd';

@inject('app', 'menu')
@observer
class Backup extends React.Component {
  render() {
    const { app, menu } = this.props;
    return (
      <div>
        <Modal
          visible={menu.showImportModal}
          centered
          title={
            menu.importProvided
              ? 'Encrypt with your password'
              : 'Import account'
          }
          closable
          destroyOnClose
          onCancel={menu.toggleImportModal}
          zIndex={1001}
          footer={null}
        >
          {menu.importProvided ? (
            <Row gutter={16}>
              <Col xs={24} sm={16}>
                <Input.Password
                  autoFocus
                  value={app.password}
                  size="large"
                  onPressEnter={() => {
                    menu.importSave();
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
                  type="primary"
                  size="large"
                  block
                  onClick={() => {
                    menu.importSave();
                  }}
                  disabled={app.password === ''}
                >
                  Save
                </Button>
              </Col>
            </Row>
          ) : (
            <Row gutter={16}>
              <Col xs={24} sm={16}>
                <Input.Password
                  autoFocus
                  placeholder="Your secret phrase"
                  value={menu.importSecretPhrase}
                  size="large"
                  onPressEnter={() => {
                    menu.importSubmit();
                  }}
                  onChange={e => {
                    menu.importSecretPhrase = e.target.value;
                  }}
                  style={{ marginBottom: 10 }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  key="importSubmit"
                  type="primary"
                  block
                  size="large"
                  onClick={() => {
                    menu.importSubmit();
                  }}
                  disabled={menu.importSecretPhrase === ''}
                >
                  Import
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

Backup.propTypes = {
  app: PropTypes.object,
  menu: PropTypes.object,
};

export default Backup;
