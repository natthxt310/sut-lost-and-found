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
      console.log('⏳ ยังไม่พบ Android Emulator หรืออุปกรณ์ที่เสียบสาย USB (กำลังรอการเชื่อมต่อ...)');
      return false;
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
    return true;
  } catch (err) {
    console.error('Error running adb:', err.message);
    return false;
  }
}

const http = require('http');

function isMetroReady() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:8081', { timeout: 1000 }, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startEmulators() {
  console.log('⏳ กำลังรอ Metro Bundler ให้พร้อมทำงานก่อนเปิดแอป...');
  let ready = false;
  for (let i = 0; i < 25; i++) {
    ready = await isMetroReady();
    if (ready) break;
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (ready) {
    console.log('✨ Metro Bundler พร้อมรับการเชื่อมต่อแล้ว!');
  }

  // พยายามตรวจหาอุปกรณ์และเปิดแอป (ถ้าเสียบสายทีหลังจะตรวจพบอัตโนมัติ)
  let detected = false;
  for (let attempt = 1; attempt <= 6; attempt++) {
    const found = launchAll();
    if (found) {
      detected = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  if (!detected) {
    console.log('ℹ️ คุณสามารถเปิดแอป Expo Go บนมือถือและสแกนหรือเข้าใช้งานได้ตลอดเวลาครับ');
  }
}

startEmulators();
