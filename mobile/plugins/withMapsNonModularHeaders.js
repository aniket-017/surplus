const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = 'Pod::BuildType.static_library';

// With `useFrameworks: "static"`, react-native-maps' `#import <React/...>` headers are
// rejected as non-modular includes, so build its pods as plain static libraries.
const PRE_INSTALL = `
  pre_install do |installer|
    installer.pod_targets.each do |pod|
      if ['react-native-maps', 'react-native-google-maps'].include?(pod.name)
        def pod.build_type
          ${MARKER}
        end
      end
    end
  end

`;

module.exports = function withMapsNonModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const podfilePath = path.join(modConfig.modRequest.platformProjectRoot, 'Podfile');
      const contents = await fs.promises.readFile(podfilePath, 'utf8');
      if (contents.includes(MARKER)) {
        return modConfig;
      }
      const anchor = '  post_install do |installer|';
      if (!contents.includes(anchor)) {
        throw new Error('withMapsNonModularHeaders: could not find post_install block in Podfile');
      }
      await fs.promises.writeFile(podfilePath, contents.replace(anchor, PRE_INSTALL + anchor));
      return modConfig;
    },
  ]);
};
