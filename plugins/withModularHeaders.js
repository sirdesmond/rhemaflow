const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo config plugin that fixes Firebase + Expo SDK 54 iOS build issues:
 * 1. Adds use_modular_headers! globally (Firebase Swift pods need it for static libs)
 * 2. Disables modular headers for gRPC pods (they break with modular headers)
 * 3. Sets CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES for RNFB targets
 *    (fixes FirebaseAuth-Swift.h not found)
 *
 * References:
 * - https://github.com/invertase/react-native-firebase/issues/8657
 * - https://github.com/expo/expo/issues/39607
 */
function withFirebaseFixes(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      let podfile = fs.readFileSync(podfilePath, "utf8");

      if (podfile.includes("# Firebase modular headers fix")) {
        return config;
      }

      // 1. Global modular headers + gRPC exclusions
      const modularHeadersFix = [
        "",
        "# Firebase modular headers fix",
        "use_modular_headers!",
        "",
        "# Disable modular headers for gRPC (incompatible)",
        "pod 'gRPC-Core', :modular_headers => false",
        "pod 'gRPC-C++', :modular_headers => false",
        "pod 'gRPC-C++/Interface', :modular_headers => false",
        "pod 'abseil', :modular_headers => false",
        "pod 'BoringSSL-GRPC', :modular_headers => false",
        "",
      ].join("\n");

      podfile = podfile.replace(
        /use_expo_modules!\n/,
        "use_expo_modules!\n" + modularHeadersFix + "\n"
      );

      // 2. Add post_install fix for RNFB non-modular includes
      const postInstallFix = [
        "",
        "    # Fix FirebaseAuth-Swift.h not found for RNFB targets",
        "    # https://github.com/expo/expo/issues/39607",
        "    installer.pods_project.targets.each do |target|",
        "      if target.name.start_with?('RNFB')",
        "        target.build_configurations.each do |bc|",
        "          bc.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'",
        "        end",
        "      end",
        "    end",
        "",
      ].join("\n");

      if (!podfile.includes("CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES")) {
        podfile = podfile.replace(
          /(post_install\s+do\s+\|installer\|)/,
          "$1\n" + postInstallFix
        );
      }

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
}

module.exports = withFirebaseFixes;
