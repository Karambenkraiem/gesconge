import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dz.gesconge.app',
  appName: 'GesConge',
  webDir: 'mobile-www',
  server: {
    // The app is a full Next.js server (SSR + API routes), so it can't be
    // shipped as a static bundle. Instead the native shell loads the live
    // deployed site directly — same approach as most production apps
    // wrapping a server-rendered web app.
    url: 'https://gesconge.alkaramsoft.ovh',
    cleartext: false,
    allowNavigation: ['gesconge.alkaramsoft.ovh'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2563eb',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#2563eb',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
