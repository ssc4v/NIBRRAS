import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.nibrras.personal',
    appName: 'NIBRRAS',
    webDir: 'www',
    server: {
          url: 'https://attached-assets--sssc4v1.replit.app',
          cleartext: false,
          allowNavigation: ['attached-assets--sssc4v1.replit.app']
    },
    ios: {
          contentInset: 'automatic'
    }
};

export default config;
