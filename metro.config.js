const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

const appNodeModules = path.resolve(projectRoot, 'node_modules');
const workspaceNodeModules = path.resolve(projectRoot, '..', 'node_modules');
const shimsRoot = path.resolve(projectRoot, 'src', 'shims');
const shimAliases = {
  '@store': path.resolve(projectRoot, 'src', 'store', 'index.js'),
  '@stores': path.resolve(projectRoot, 'src', 'store', 'stores.js'),
  '@react-navigation/native': path.resolve(shimsRoot, 'navigation.js'),
  '@controleonline/ui-common/src/react/components/MessageService': path.resolve(
    shimsRoot,
    'messageService.js',
  ),
  '@controleonline/../../src/styles/branding': path.resolve(shimsRoot, 'branding.js'),
  'react-native-animatable': path.resolve(shimsRoot, 'animatable.js'),
  'react-native-safe-area-context': path.resolve(shimsRoot, 'safeAreaContext.js'),
  'react-native-vector-icons/Feather': path.resolve(
    shimsRoot,
    'react-native-vector-icons',
    'Feather.js',
  ),
};

config.useWatchman = false;

config.resolver.nodeModulesPaths = [
  appNodeModules,
  workspaceNodeModules,
];

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  ...shimAliases,
  react: path.resolve(appNodeModules, 'react'),
  'react-native': path.resolve(appNodeModules, 'react-native'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const alias = shimAliases[moduleName];

  if (alias) {
    return context.resolveRequest(context, alias, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
