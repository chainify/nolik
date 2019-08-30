import React from 'react';
import PropTypes from 'prop-types';
import Router, { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { Row, Col, Input, Button, notification, Icon, Divider } from 'antd';
import mouseTrap from 'react-mousetrap';

@inject('login', 'alice')
@observer
class Index extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const { login } = this.props;
        // this.openNotification();
    }

    render() {
        const { login, alice } = this.props;
        return (
            <div className="main">
                <Row>
                    <Col xs={{ offset: 4, span: 12}}>
                        <h1>LANDING PAGE</h1>
                    </Col>
                </Row>
                <style jsx>{`
                    .main {
                        height: 100vh;
                        background: #fff;
                    }
                `}</style>
            </div>
        );
    }
}

Index.propTypes = {
    index: PropTypes.object,
};

export default withRouter(mouseTrap(Index))