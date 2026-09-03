import { LogBox } from 'react-native';

// 🔇 ซ่อนแจ้งเตือน Console Error ของ Expo Go เรื่อง Remote Push Notification SDK 53+
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'Android Push notifications (remote notifications)',
  'expo-notifications',
]);

if (typeof console !== 'undefined' && console.error) {
  const origError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Android Push notifications') || args[0].includes('expo-notifications:'))
    ) {
      return;
    }
    origError(...args);
  };
}

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
