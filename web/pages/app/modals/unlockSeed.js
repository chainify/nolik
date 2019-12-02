import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Row, Col, Modal, Input, Button, Icon } from 'antd';

@inject('explorer')
@observer
class Backup extends React.Component {
  render() {
    const { explorer } = this.props;
    return (
      <div>
        <Modal
          visible={explorer.showSeedModal}
          centered
          title="Import secret phrase"
          closable
          destroyOnClose
          onCancel={explorer.toggleSeedModal}
          zIndex={1001}
          footer={null}
        >
          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Input.Password
                autoFocus
                placeholder="Your secret phrase"
                value={explorer.seed}
                size="large"
                onPressEnter={() => {
                  explorer.importSubmit();
                }}
                onChange={e => {
                  explorer.seed = e.target.value;
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
                  explorer.importSubmit();
                }}
                disabled={explorer.seed === ''}
              >
                unlock
              </Button>
            </Col>
          </Row>
        </Modal>
        <style jsx>{``}</style>
      </div>
    );
  }
}

Backup.propTypes = {
  explorer: PropTypes.object,
};

export default Backup;
