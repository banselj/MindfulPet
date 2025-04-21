module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', '@babel/preset-typescript', '@babel/preset-react'],
    plugins: [
      'react-native-reanimated/plugin',
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true
      }],
      [
        'module-resolver',
        {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.svg'],
          alias: {
            '@components': './src/components',
            '@screens': './src/screens',
            '@contexts': './src/contexts',
            '@assets': './assets',
          },
        },
      ],
    ],
  };
};
