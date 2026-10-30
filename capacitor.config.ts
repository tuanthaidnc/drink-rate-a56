import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tuanthaidnc.notfood',
  appName: 'NỐT',
  webDir: 'build-android',
  backgroundColor: '#0b0d0c',
  loggingBehavior: 'debug',
  initialFocus: false,
  android: { allowMixedContent: false, webContentsDebuggingEnabled: false },
  // The runtime handles old WebView engines and provides safe-area values on
  // modern edge-to-edge Android. The web UI consumes those env() values.
  plugins: {
    SystemBars: { insetsHandling: 'native', initialViewportFitValueHint: 'cover', style: 'DARK' },
  },
};
export default config;
