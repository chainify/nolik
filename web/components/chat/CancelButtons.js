import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Button, Row, Col } from 'antd';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSync, faTimesCircle } from '@fortawesome/free-solid-svg-icons';


@inject('chat')
@observer
class ChatButtons extends React.Component {

    render() {
        const { chat } = this.props;

        return (
            <div>
                <Row>
                    <Col xs={0} sm={24}>
                        <Button
                            onClick={chat.selfClearChat}
                        >
                            <FontAwesomeIcon icon={faSync} />&nbsp;Clear
                        </Button>
                    </Col>
                    <Col xs={24} sm={0}>
                        <Button
                            shape="circle"
                            onClick={chat.selfClearChat}
                        >
                            <FontAwesomeIcon icon={faSync} />
                        </Button>
                    </Col>
                </Row>
                <style jsx>{`
                    
                `}</style>
            </div>
        );
    }
}

ChatButtons.propTypes = {
    // index: PropTypes.object,
};

export default ChatButtons;