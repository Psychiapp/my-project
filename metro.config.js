const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// Add PDF to asset extensions
config.resolver.assetExts.push('pdf');

// Exclude native-only modules from web bundling
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Block @stripe/stripe-react-native on web - it's native only
  if (platform === 'web' && moduleName === '@stripe/stripe-react-native') {
    return {
      type: 'empty',
    };
  }
  // Fall back to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;