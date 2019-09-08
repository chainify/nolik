import React from 'react';
import NextHead from 'next/head';
import { string } from 'prop-types';

const defaultDescription = '';
const defaultOGURL = '';

const Head = props => (
  <NextHead>
    <meta charSet="UTF-8" />
    <title>{props.title || ''}</title>
    <meta
      name="description"
      content={props.description || defaultDescription}
    />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" sizes="192x192" href="/static/touch-icon.png" />
    <link rel="apple-touch-icon" href="/static/touch-icon.png" />
    <link rel="mask-icon" href="/static/favicon-mask.svg" color="#49B882" />
    <link rel="icon" href="/static/favicon.ico" />
    <meta property="og:url" content={props.url || defaultOGURL} />
    <meta property="og:title" content={props.title || ''} />
    <meta
      property="og:description"
      content={props.description || defaultDescription}
    />
    <link
      href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,700&amp;display=swap&amp;subset=cyrillic"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css?family=Muli&amp;display=swap"
      rel="stylesheet"
    />
  </NextHead>
);

Head.propTypes = {
  title: string,
  description: string,
  url: string,
};

export default Head;
