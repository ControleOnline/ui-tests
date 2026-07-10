module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@env': './config/env.local.js',
          '@store': './src/store/index.js',
          '@stores': './src/store/stores.js',
          '@src': './src',
        },
      },
    ],
  ],
};
