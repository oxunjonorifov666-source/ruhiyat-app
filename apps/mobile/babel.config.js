module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated 4.x: worklets Babel plugin oxirida (RN CLI / EAS); reanimated/plugin o‘rniga
      // @see https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/
      'react-native-worklets/plugin',
    ],
  };
};
