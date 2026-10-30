import { Capacitor, registerPlugin } from '@capacitor/core';

export const isNativeApp = Capacitor.isNativePlatform();
const NativeDisplay = registerPlugin<{
  preferences(): Promise<{ reducedMotion: boolean; refreshRate: number }>;
}>('NotDisplay');

export async function initializeNative(onMotion: (reduced: boolean) => void) {
  if (!isNativeApp) return;
  document.documentElement.dataset.platform = 'android';
  const { App } = await import('@capacitor/app');
  const update = async () => {
    try {
      const preferences = await NativeDisplay.preferences();
      onMotion(preferences.reducedMotion);
    } catch {
      // Browser media queries remain the fallback on older native shells.
    }
  };
  await update();
  await App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) void update();
  });
  await App.addListener('backButton', () => window.dispatchEvent(new Event('not-native-back')));
}

export async function minimizeNativeApp() {
  if (isNativeApp) await (await import('@capacitor/app')).App.minimizeApp();
}
