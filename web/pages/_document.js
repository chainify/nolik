import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <html lang={this.props.__NEXT_DATA__.props.initialLanguage}>
        <Head>
          <meta charSet="utf-8" />
          <style>{`body { margin: 0; background: #fff; } /* custom! */`}</style>
        </Head>
        <body className="custom_class">
          <Main />
          <NextScript />
        </body>
        <style jsx>{`
          body.custom_class {
            background: #fff;
          }
        `}</style>
      </html>
    );
  }
}

export default MyDocument;
