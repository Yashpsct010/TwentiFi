const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .wasm files (required by expo-sqlite on web)
config.resolver.assetExts.push("wasm");

// Ignore the website directory to prevent React Native duplicate module errors
config.resolver.blockList = [/\/website\/.*/];

module.exports = withNativeWind(config, { input: "./global.css" });
