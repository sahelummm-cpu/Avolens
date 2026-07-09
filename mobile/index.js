// Register the Android widget task handler before the app boots, then hand off
// to expo-router. `register` is platform-resolved (no-op on web/iOS).
require('./src/widgets/register');
require('expo-router/entry');
