import React from 'react'
import App, { Container } from 'next/app'
import { Provider } from 'mobx-react';
import stores from '../store/stores';
// import { appWithTranslation } from './../i18n';
import Head from '../components/Head';
import stylesheet from 'antd/dist/antd.min.css'

class Layout extends React.Component {
  render () {
    const { children } = this.props;
    return <div className='layout'>{children}</div>
  }
}

class MyApp extends App {
  render () {
    const { Component, pageProps } = this.props
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
    )
  }
}

// export default appWithTranslation(MyApp)
export default MyApp