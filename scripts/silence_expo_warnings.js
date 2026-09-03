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
    content = content.replace(/console\.error\(message\);/g, '// console.error(message);');
    content = content.replace(/console\.warn\(message\);/g, '// console.warn(message);');
    fs.writeFileSync(targetWarnJs, content, 'utf8');
    console.log('✅ Silenced expo-notifications push warning in node_modules');
  }
} catch (err) {
  console.warn('⚠️ Could not patch expo-notifications warnings:', err.message);
}
