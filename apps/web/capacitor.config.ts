import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.koin.finance',
  appName: 'Koin',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    // Configured for biometric auth, secure storage, and haptics
  },
};

export default config;
