const { withMainActivity } = require('@expo/config-plugins');

/**
 * react-native-health-connect requires
 * `HealthConnectPermissionDelegate.setPermissionDelegate(this)` to run in
 * MainActivity.onCreate. Its bundled Expo plugin only patches the manifest,
 * so calling requestPermission() crashes the app with an uninitialized
 * `lateinit` launcher inside a coroutine. This plugin injects the delegate
 * registration into the generated Kotlin MainActivity.
 */
const IMPORT = 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';
const REGISTER = 'HealthConnectPermissionDelegate.setPermissionDelegate(this)';

module.exports = function withHealthConnectDelegate(config) {
  return withMainActivity(config, (config) => {
    if (config.modResults.language !== 'kt') {
      throw new Error('withHealthConnectDelegate: expected a Kotlin MainActivity');
    }
    let src = config.modResults.contents;

    if (!src.includes(IMPORT)) {
      src = src.replace(/^(package .*\n)/m, `$1\n${IMPORT}\n`);
    }

    if (!src.includes(REGISTER)) {
      const onCreateCall = /(super\.onCreate\([^)]*\)\n)/;
      if (onCreateCall.test(src)) {
        src = src.replace(onCreateCall, `$1    ${REGISTER}\n`);
      } else {
        // No onCreate override in the template — add one.
        src = src.replace(
          /(class MainActivity[^{]*\{\n)/,
          `$1  override fun onCreate(savedInstanceState: android.os.Bundle?) {\n` +
            `    super.onCreate(null)\n    ${REGISTER}\n  }\n\n`,
        );
      }
    }

    config.modResults.contents = src;
    return config;
  });
};
