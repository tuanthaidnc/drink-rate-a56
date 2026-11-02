import { Capacitor, registerPlugin, SystemBars, SystemBarsStyle } from '@capacitor/core';

export const isNativeApp = Capacitor.isNativePlatform();
const NativeDisplay = registerPlugin<{
  preferences(): Promise<{ reducedMotion: boolean; refreshRate: number }>;
  appearance(options: { dark: boolean }): Promise<void>;
}>('NotDisplay');

let appearanceRequest = 0;
export async function syncNativeBars(theme: 'light' | 'dark') {
  if (!isNativeApp) return;
  const request = ++appearanceRequest;
  await SystemBars.setStyle({
    style: theme === 'light' ? SystemBarsStyle.Light : SystemBarsStyle.Dark,
  });
  if (request === appearanceRequest) await NativeDisplay.appearance({ dark: theme === 'dark' });
}

export async function initializeNative(onMotion: (reduced: boolean) => void) {
  if (!isNativeApp) return;
  document.documentElement.dataset.platform = 'android';
  const { App } = await import('@capacitor/app');
  const update = async () => {
    try {
      await syncNativeBars(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
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
