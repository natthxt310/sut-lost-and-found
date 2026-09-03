import { LogBox } from 'react-native';

// 🔇 ซ่อนการแจ้งเตือนและข้อความ Error/Warning เฉพาะของ Expo Go เรื่อง Remote Push Notification
LogBox.ignoreLogs([
  'expo-notifications',
  'Android Push notifications',
  'development build instead of Expo Go',
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'shouldShowAlert is deprecated',
]);

const shouldSuppress = (args: any[]): boolean => {
  try {
    const str = args
      .map((a) => (typeof a === 'string' ? a : (a?.message || a?.stack || JSON.stringify(a) || '')))
      .join(' ');
    return (
      str.includes('expo-notifications') ||
      str.includes('Android Push notifications') ||
      str.includes('development build instead of Expo Go') ||
      str.includes('shouldShowAlert')
    );
  } catch {
    return false;
  }
};

if (typeof console !== 'undefined') {
  if (console.error) {
    const origError = console.error;
    console.error = (...args: any[]) => {
      if (shouldSuppress(args)) return;
      origError.apply(console, args);
    };
  }
  if (console.warn) {
    const origWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (shouldSuppress(args)) return;
      origWarn.apply(console, args);
    };
  }
}

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
