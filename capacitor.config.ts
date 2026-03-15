import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9fd45d52efd24f9e81c548a7f88455ac',
  appName: 'eco-signal-ai',
  webDir: 'dist',
  server: {
    url: 'https://9fd45d52-efd2-4f9e-81c5-48a7f88455ac.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      backgroundColor: '#050a14',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#050a14',
    },
  },
};

export default config;
