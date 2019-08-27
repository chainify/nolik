import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { Input, Button, Icon } from 'antd';

import Cdms from './cdms';
import Compose from './compose';

@inject('chat')
@observer
class Chat extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const { chat, router } = this.props;
        chat.generateSeed();
        chat.recipient = router.query.publicKey;
    }

    render() {
        const { chat } = this.props;
        return (
            <div>
                <div className="container">
                    <h2>Subject:</h2>
                    <p>{chat.subject}</p>
                    <hr />
                    <h2>Message:</h2>
                    <p>{chat.message}</p>
                    <button
                        onClick={chat.sendSponsoredCdm}
                    >
                        Send
                    </button>
                </div>
                <style jsx>{`
                    .container {
                        height: 100vh;
                        background: #fafafa;
                    }

                    .empty {
                        height: 100vh;
                        width: 100%;
                        background: url(/static/empty.svg) no-repeat center center;
                    }
                `}</style>
            </div>
        );
    }
}

Chat.propTypes = {
    // index: PropTypes.object,
};

export default withRouter(Chat);