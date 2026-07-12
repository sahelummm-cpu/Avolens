/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  name: 'AvoLensWidget',
  // Shared App Group so the app (JS via ExtensionStorage) and the widget read
  // the same snapshot. Mirrors ios.entitlements in app.json.
  entitlements: {
    'com.apple.security.application-groups': ['group.app.avolens.mobile'],
  },
};
