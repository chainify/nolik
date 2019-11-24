import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Row, Col, Modal, Timeline, Input, Icon, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlagCheckered } from '@fortawesome/free-solid-svg-icons';
const { TextArea } = Input;

@inject('app')
@observer
class Welcome extends React.Component {
  render() {
    const { app } = this.props;
    return (
      <div>
        <Modal
          visible={app.showWelcomeModal}
          centered
          destroyOnClose
          closable={false}
          footer={null}
        >
          <Timeline>
            <Timeline.Item
              color="green"
              dot={<Icon type="check-circle" theme="filled" />}
            >
              <p>Ключи шифрования созданы</p>
            </Timeline.Item>
            <Timeline.Item color="green">
              <div>
                <Row gutter={8}>
                  <Col>
                    <p>Создай свой пароль (для каждого устройства свой)</p>
                  </Col>
                </Row>
                <Row gutter={8}>
                  <Col xs={24} sm={12}>
                    <p>
                      <Input.Password
                        autoFocus
                        placeholder="Пароль"
                        onChange={e => {
                          app.password = e.target.value;
                        }}
                        onPressEnter={app.savePassword}
                        value={app.password}
                      />
                    </p>
                  </Col>
                  <Col xs={24} sm={12}>
                    <p>
                      <Input.Password
                        placeholder="Повтори пароль"
                        onChange={e => {
                          app.passwordRepeat = e.target.value;
                        }}
                        onPressEnter={app.savePassword}
                        value={app.passwordRepeat}
                      />
                    </p>
                  </Col>
                </Row>
                <Row gutter={8}>
                  <Col>
                    <p>
                      <TextArea
                        placeholder="Подсказка пароля (не обязательно, но рекомендуется)"
                        onChange={e => {
                          app.passwordHint = e.target.value;
                        }}
                        value={app.passwordHint}
                      />
                    </p>
                  </Col>
                </Row>
                <Row gutter={8}>
                  <Col>
                    <p>
                      <Button
                        type="primary"
                        onClick={app.savePassword}
                        disabled={
                          app.password === '' ||
                          app.password !== app.passwordRepeat
                        }
                      >
                        Сохранить и начать переписываться
                      </Button>
                    </p>
                  </Col>
                </Row>
              </div>
            </Timeline.Item>
            <Timeline.Item
              color="grey"
              dot={<FontAwesomeIcon icon={faFlagCheckered} />}
              style={{ paddingBottom: 0, marginBottom: 0, height: 18 }}
            >
              <p>Начать переписываться</p>
            </Timeline.Item>
          </Timeline>
        </Modal>
        <style jsx>{``}</style>
      </div>
    );
  }
}

Welcome.propTypes = {
  app: PropTypes.object,
};

export default Welcome;
