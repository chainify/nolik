import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { observer, inject } from 'mobx-react';
import { autorun, toJS } from 'mobx';
// import { i18n, Link as Tlink, withNamespaces } from '../i18n';
import { Input, Button, Icon } from 'antd';

import Cdms from './cmds';
import Compose from './compose';

@inject('cdms')
@observer
class Main extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { cdms } = this.props;
        return (
            <div>
                <div className="container">
                    {cdms.composeMode ? <Compose /> : <Cdms />}
                </div>
                <style jsx>{`
                    .container {
                        height: 100vh;
                        background: #fafafa;
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