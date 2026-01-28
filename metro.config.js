const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add PDF to asset extensions
config.resolver.assetExts.push('pdf');

module.exports = config;
