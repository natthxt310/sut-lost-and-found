const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

function getAdbPath() {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  return path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
}

function launchAll() {
  const adb = getAdbPath();
  try {
    const devicesOutput = execSync(`"${adb}" devices`, { encoding: 'utf8' });
    const lines = devicesOutput.split('\n').filter((l) => l.includes('\tdevice'));
    const devices = lines.map((l) => l.split('\t')[0].trim());

    if (devices.length === 0) {
      console.log('⚠️ ไม่พบ Android Emulator หรืออุปกรณ์ที่เชื่อมต่ออยู่');
      return;
    }

    console.log(`📱 กำลังเปิด Expo Go บนอุปกรณ์ทั้งหมด ${devices.length} เครื่อง: ${devices.join(', ')}`);

    for (const device of devices) {
      try {
        execSync(`"${adb}" -s ${device} reverse tcp:8081 tcp:8081`, { stdio: 'ignore' });
        execSync(`"${adb}" -s ${device} reverse tcp:3000 tcp:3000`, { stdio: 'ignore' });
        execSync(
          `"${adb}" -s ${device} shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent`,
          { stdio: 'ignore' }
        );
        console.log(`✅ เปิดแอปบน ${device} เรียบร้อยแล้ว`);
      } catch (err) {
        console.warn(`❌ ไม่สามารถเปิดบน ${device}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error running adb:', err.message);
  }
}

// เปิดรอบแรกที่ 4 วินาที และเปิดซ้ำอีกครั้งที่ 8 วินาทีเพื่อความชัวร์เมื่อ Metro พร้อม
setTimeout(launchAll, 4000);
setTimeout(launchAll, 8000);
