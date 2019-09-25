const withCss = require('@zeit/next-css');
if (typeof require !== 'undefined') {
  require.extensions['.css'] = file => {}
}

module.exports = withCss({
  cssModules: true,
  publicRuntimeConfig: {
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    CLIENT_PREFIX: process.env.CLIENT_PREFIX,
    ASSET_ID: process.env.ASSET_ID,
    API_HOST: process.env.API_HOST,
    NETWORK: process.env.NETWORK,
    CDM_VERSION: process.env.CDM_VERSION,
    SPONSOR_HOST: process.env.SPONSOR_HOST,
    CLIENT_SEED: process.env.CLIENT_SEED,
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
    websocketPort: process.env.WS_PORT || 3001,
  },
});
