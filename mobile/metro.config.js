const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = fs.realpathSync(__dirname);
const config = getDefaultConfig(projectRoot);
const defaultResolveRequest = config.resolver.resolveRequest;
const reactRoot = path.dirname(require.resolve('react/package.json', { paths: [projectRoot] }));

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  react: reactRoot,
};

const nativeOnlyModules = [
  'react-native-maps',
  '@react-native-firebase/app',
  '@react-native-firebase/auth',
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // C:\surplus junction: Expo passes a relative path like
  // ./../../Users/<user>/Desktop/Projects/surplus/mobile/node_modules/...
  // which Metro then resolves from the realpath and misses. Map it back.
  const normalized = String(moduleName).replace(/\\/g, '/');
  const marker = 'node_modules/';
  if (normalized.includes('/Users/') && normalized.includes(marker)) {
    const fromNodeModules = normalized.slice(normalized.lastIndexOf(marker));
    const absolute = path.normalize(path.join(projectRoot, fromNodeModules));
    if (fs.existsSync(absolute)) {
      return { filePath: absolute, type: 'sourceFile' };
    }
  }

  const isNative = platform === 'ios' || platform === 'android';
  if (
    !isNative &&
    nativeOnlyModules.some((name) => moduleName === name || moduleName.startsWith(`${name}/`))
  ) {
    return { type: 'empty' };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
