module.exports = function (api) {
  // Expo's default Babel preset handles React Native and TypeScript transforms.
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-worklets/plugin"]
  };
};
