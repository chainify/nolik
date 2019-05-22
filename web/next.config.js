const withCss = require('@zeit/next-css');
if (typeof require !== 'undefined') {
  require.extensions['.css'] = file => {}
}

const webpack = require('webpack');
const { parsed: localEnv } = require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env',
});


module.exports = withCss()
module.exports = {
  publicRuntimeConfig: {
    SEED: process.env.SEED,
  },
  webpack: config => {
    // Fixes npm packages that depend on `fs` module
    config.node = {
      fs: 'empty',
    }
    config.plugins.push(new webpack.EnvironmentPlugin(localEnv));
    return config
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
    websocketPort: process.env.WS_PORT,
  }
}
