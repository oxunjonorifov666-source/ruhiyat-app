module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated 4 / worklets — oxirgi plugin bo‘lishi shart
      'react-native-reanimated/plugin',
    ],
  };
};
