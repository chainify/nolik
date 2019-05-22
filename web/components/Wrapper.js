import React from 'react';
import { Layout, Menu, Icon } from 'antd';
import { observer, inject } from 'mobx-react';
import Router from 'next/router';

@inject('wrapper')
@observer
class Wrapper extends React.Component {
    render() {
        const { children, wrapper } = this.props;
        const {
            Header, Content, Footer, Sider,
        } = Layout;

        return (
            <div>
                <div className="wrapper">
                    {children}
                </div>
                <style jsx>{`
                    .wrapper {
                        height: 100vh;
                    }
                `}</style>
            </div>
        );
    }
}

Wrapper.propTypes = {
    // index: PropTypes.object,
};

export default Wrapper