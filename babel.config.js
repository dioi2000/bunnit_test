module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          // '@assets': './src/assets',
          '@screens': './src/screens',
          '@navigators': './src/navigators',
        },
      },
    ],
    'react-native-worklets/plugin',
  ],
};
