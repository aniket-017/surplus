const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = 'Pod::BuildType.static_library';

module.exports = function withMapsNonModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const podfilePath = path.join(modConfig.modRequest.platformProjectRoot, 'Podfile');
      const contents = await fs.promises.readFile(podfilePath, 'utf8');
      if (contents.includes(MARKER)) {
        return modConfig;
      }
      return modConfig;
    },
  ]);
};
