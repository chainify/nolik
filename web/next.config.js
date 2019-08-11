const withCss = require('@zeit/next-css');
if (typeof require !== 'undefined') {
  require.extensions['.css'] = file => {}
}

module.exports = withCss({
  publicRuntimeConfig: {
    KEEPER_SECRET: process.env.KEEPER_SECRET,
    ASSET_ID: process.env.ASSET_ID,
    API_HOST: process.env.API_HOST,
    NETWORK: process.env.NETWORK,
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
    websocketPort: process.env.WS_PORT || 3001,
  }
});
