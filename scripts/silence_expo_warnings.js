const fs = require('fs');
const path = require('path');

const targetIndexJs = path.join(__dirname, '..', 'lost-and-found', 'node_modules', 'expo-notifications', 'build', 'index.js');
const targetWarnJs = path.join(__dirname, '..', 'lost-and-found', 'node_modules', 'expo-notifications', 'build', 'warnOfExpoGoPushUsage.js');

try {
  if (fs.existsSync(targetIndexJs)) {
    let content = fs.readFileSync(targetIndexJs, 'utf8');
    content = content.replace(/console\.warn\(message\);/g, '// console.warn(message);');
    fs.writeFileSync(targetIndexJs, content, 'utf8');
    console.log('✅ Silenced expo-notifications top-level warning in node_modules');
  }

  if (fs.existsSync(targetWarnJs)) {
    let content = fs.readFileSync(targetWarnJs, 'utf8');
    content = content.replace(/throw new Error\(message\);/g, '// throw new Error(message);');
    content = content.replace(/console\.error\(message\);/g, '// console.error(message);');
    content = content.replace(/console\.warn\(message\);/g, '// console.warn(message);');
    fs.writeFileSync(targetWarnJs, content, 'utf8');
    console.log('✅ Silenced expo-notifications push warning and crash in node_modules');
  }

  const targetTopicJs = path.join(__dirname, '..', 'lost-and-found', 'node_modules', 'expo-notifications', 'build', 'TopicSubscriptionModule.android.js');
  if (fs.existsSync(targetTopicJs)) {
    let content = fs.readFileSync(targetTopicJs, 'utf8');
    if (!content.includes('requireOptionalNativeModule')) {
      content = "import { requireOptionalNativeModule } from 'expo-modules-core';\nconst nativeMod = requireOptionalNativeModule('ExpoTopicSubscriptionModule');\nexport default nativeMod || {\n    addListener: () => {},\n    removeListeners: () => {},\n    subscribeToTopicAsync: () => Promise.resolve(null),\n    unsubscribeFromTopicAsync: () => Promise.resolve(null),\n};\n";
      fs.writeFileSync(targetTopicJs, content, 'utf8');
      console.log('✅ Patched TopicSubscriptionModule for Expo Go compatibility');
    }
  }

  const targetTsconfig = path.join(__dirname, '..', 'lost-and-found', 'node_modules', 'expo-notifications', 'tsconfig.json');
  if (fs.existsSync(targetTsconfig)) {
    let content = fs.readFileSync(targetTsconfig, 'utf8');
    if (content.includes('expo-module-scripts/tsconfig.base')) {
      content = content.replace('expo-module-scripts/tsconfig.base', 'expo/tsconfig.base');
      fs.writeFileSync(targetTsconfig, content, 'utf8');
      console.log('✅ Fixed expo-notifications tsconfig.json extends error');
    }
  }
} catch (err) {
  console.warn('⚠️ Could not patch expo-notifications warnings:', err.message);
}
