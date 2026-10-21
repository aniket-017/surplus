const { withDangerousMod, withXcodeProject } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const TARGET_NAME = 'NotificationService';
const SOURCE_DIR = path.join(__dirname, TARGET_NAME);
const SWIFT_FILE = `${TARGET_NAME}.swift`;
const PLIST_FILE = 'Info.plist';

/** Prebuild writes these into the host Info.plist; the extension must match or App Store validation fails. */
function getAppVersions(config) {
  return {
    version: config.version || '1.0.0',
    buildNumber: config.ios?.buildNumber || '1',
  };
}

function buildInfoPlist(config) {
  const { version, buildNumber } = getAppVersions(config);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>$(DEVELOPMENT_LANGUAGE)</string>
  <key>CFBundleDisplayName</key>
  <string>${TARGET_NAME}</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>$(PRODUCT_NAME)</string>
  <key>CFBundlePackageType</key>
  <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
  <key>CFBundleShortVersionString</key>
  <string>${version}</string>
  <key>CFBundleVersion</key>
  <string>${buildNumber}</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.usernotifications.service</string>
    <key>NSExtensionPrincipalClass</key>
    <string>$(PRODUCT_MODULE_NAME).NotificationService</string>
  </dict>
</dict>
</plist>
`;
}

function withExtensionFiles(config) {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const targetDir = path.join(modConfig.modRequest.platformProjectRoot, TARGET_NAME);
      await fs.promises.mkdir(targetDir, { recursive: true });
      await fs.promises.copyFile(path.join(SOURCE_DIR, SWIFT_FILE), path.join(targetDir, SWIFT_FILE));
      await fs.promises.writeFile(path.join(targetDir, PLIST_FILE), buildInfoPlist(modConfig));
      return modConfig;
    },
  ]);
}

function getHostBuildSettings(project) {
  const hostTarget = project.getFirstTarget().firstTarget;
  const configList = project.pbxXCConfigurationList()[hostTarget.buildConfigurationList];
  const configurations = project.pbxXCBuildConfigurationSection();
  const settingsByName = {};

  for (const { value } of configList.buildConfigurations) {
    const configuration = configurations[value];
    settingsByName[configuration.name] = configuration.buildSettings;
  }
  return settingsByName;
}

/** Embedding after the CocoaPods/React Native script phases makes Xcode report a build cycle. */
function moveEmbedPhaseAfterResources(project) {
  const hostTarget = project.getFirstTarget().firstTarget;
  const copyPhases = project.hash.project.objects.PBXCopyFilesBuildPhase || {};
  const embedPhaseId = Object.keys(copyPhases).find((key) => {
    const phase = copyPhases[key];
    return (
      typeof phase === 'object' &&
      phase.files?.some((file) => String(file.comment || '').includes(`${TARGET_NAME}.appex`))
    );
  });
  if (!embedPhaseId) return;

  copyPhases[embedPhaseId].name = '"Embed App Extensions"';

  const phases = hostTarget.buildPhases;
  const currentIndex = phases.findIndex((phase) => phase.value === embedPhaseId);
  const [embedPhase] = phases.splice(currentIndex, 1);
  embedPhase.comment = 'Embed App Extensions';
  const resourcesIndex = phases.findIndex((phase) => phase.comment === 'Resources');
  phases.splice(resourcesIndex + 1, 0, embedPhase);
}

function withExtensionTarget(config) {
  return withXcodeProject(config, (modConfig) => {
    const project = modConfig.modResults;
    if (project.pbxTargetByName(TARGET_NAME)) {
      moveEmbedPhaseAfterResources(project);
      return modConfig;
    }

    const bundleIdentifier = `${modConfig.ios.bundleIdentifier}.${TARGET_NAME}`;
    const hostSettings = getHostBuildSettings(project);
    const { version, buildNumber } = getAppVersions(modConfig);

    const objects = project.hash.project.objects;
    objects.PBXTargetDependency = objects.PBXTargetDependency || {};
    objects.PBXContainerItemProxy = objects.PBXContainerItemProxy || {};

    const group = project.addPbxGroup([SWIFT_FILE, PLIST_FILE], TARGET_NAME, TARGET_NAME);
    const mainGroupId = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(group.uuid, mainGroupId);

    const target = project.addTarget(TARGET_NAME, 'app_extension', TARGET_NAME, bundleIdentifier);
    project.addBuildPhase([SWIFT_FILE], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
    project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
    project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);

    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configurations)) {
      const configuration = configurations[key];
      const settings = configuration?.buildSettings;
      if (!settings || settings.PRODUCT_NAME !== `"${TARGET_NAME}"`) continue;

      const host = hostSettings[configuration.name] || hostSettings.Release || {};
      settings.INFOPLIST_FILE = `${TARGET_NAME}/${PLIST_FILE}`;
      settings.CODE_SIGN_STYLE = 'Automatic';
      settings.SWIFT_VERSION = host.SWIFT_VERSION || '5.0';
      settings.IPHONEOS_DEPLOYMENT_TARGET = host.IPHONEOS_DEPLOYMENT_TARGET || '15.1';
      settings.TARGETED_DEVICE_FAMILY = host.TARGETED_DEVICE_FAMILY || '"1,2"';
      settings.MARKETING_VERSION = version;
      settings.CURRENT_PROJECT_VERSION = buildNumber;
      settings.DEVELOPMENT_TEAM = host.DEVELOPMENT_TEAM ?? modConfig.ios.appleTeamId ?? '""';
      if (host['"DEVELOPMENT_TEAM[sdk=iphoneos*]"']) {
        settings['"DEVELOPMENT_TEAM[sdk=iphoneos*]"'] = host['"DEVELOPMENT_TEAM[sdk=iphoneos*]"'];
      }
      settings.APPLICATION_EXTENSION_API_ONLY = 'YES';
      settings.SWIFT_EMIT_LOC_STRINGS = 'YES';
    }

    moveEmbedPhaseAfterResources(project);
    return modConfig;
  });
}

module.exports = function withNotificationServiceExtension(config) {
  config = withExtensionFiles(config);
  config = withExtensionTarget(config);
  return config;
};
