// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Firebase JS SDK uses .cjs and package exports
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = true;

// Prevent JavaScript heap out-of-memory during bundle transformation
config.maxWorkers = 2;

module.exports = config;
