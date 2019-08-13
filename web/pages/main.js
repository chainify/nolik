import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { Input, Button, Icon } from 'antd';

import Cdms from './cdms';
import Compose from './compose';

@inject('compose', 'threads')
@observer
class Main extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { compose, threads } = this.props;
        return (
            <div>
                <div className="container">
                    {compose.composeMode
                        ? <Compose />
                        : threads.current ? <Cdms /> : <div className="empty" />}
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

Main.propTypes = {
    // index: PropTypes.object,
};

export default Main;