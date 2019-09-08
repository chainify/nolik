import React from 'react';
import PropTypes from 'prop-types';
import App, { Container } from 'next/app';
import { Provider } from 'mobx-react';
import stylesheet from 'antd/dist/antd.min.css';
import stores from '../store/stores';
// import { appWithTranslation } from './../i18n';
import Head from './_head';

const Layout = function(props) {
  const { children } = props;
  return <div className="layout">{children}</div>;
};

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <Provider {...stores}>
        <Container>
          <Head title="Nolik Instant Messenger"></Head>
          <Layout>
            <Component {...pageProps} />
          </Layout>
          <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
        </Container>
      </Provider>
    );
  }
}

Layout.propTypes = {
  children: PropTypes.object,
};

export default MyApp;
