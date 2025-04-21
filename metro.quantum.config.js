const { makeMetroConfig } = require('@expo/metro-config');
const path = require('path');

module.exports = async () => {
  const baseConfig = await makeMetroConfig(__dirname);

  return {
    ...baseConfig,
    resolver: {
      ...baseConfig.resolver,
      extraNodeModules: {
        ...baseConfig.resolver.extraNodeModules,
        '@mindulpet/quantum': path.resolve(__dirname, 'src/security/quantum')
      },
      unstable_enablePackageExports: true
    },
    transformer: {
      ...baseConfig.transformer,
      minifierPath: '@expo/metro-minify-quantum',
      minifierConfig: {
        quantumOptimizer: {
          latticeFoldThreshold: 0.72,
          hologramWhitelist: ['PetHologram.qglsl'],
          neuralOptimizations: true,
          quantumTreeShaking: true
        }
      }
    },
    serializer: {
      ...baseConfig.serializer,
      customSerializer: require('@expo/metro-serializer-quantum')
    }
  };
};
