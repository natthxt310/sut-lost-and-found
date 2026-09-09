const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

function getAdbPath() {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  return path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
}

const launchedDevices = new Set();

function launchAll(silent = false) {
  const adb = getAdbPath();
  try {
    const devicesOutput = execSync(`"${adb}" devices`, { encoding: 'utf8' });
    const lines = devicesOutput.split('\n').filter((l) => l.includes('\tdevice'));
    const devices = lines.map((l) => l.split('\t')[0].trim());

    if (devices.length === 0) {
      if (!silent) console.log('⏳ กำลังรอการเชื่อมต่อ Android Emulator หรือมือถือผ่านสาย USB...');
      return false;
    }

    for (const device of devices) {
      try {
        execSync(`"${adb}" -s ${device} reverse tcp:8081 tcp:8081`, { stdio: 'ignore' });
        execSync(`"${adb}" -s ${device} reverse tcp:3000 tcp:3000`, { stdio: 'ignore' });
        if (!launchedDevices.has(device)) {
          launchedDevices.add(device);
          execSync(
            `"${adb}" -s ${device} shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent`,
            { stdio: 'ignore' }
          );
          console.log(`📱 เปิดแอปและเชื่อมต่อพอร์ตบน ${device} เรียบร้อยแล้ว`);
        }
      } catch (err) {
        if (!silent) console.warn(`❌ ข้อผิดพลาดบน ${device}:`, err.message);
      }
    }
    return true;
  } catch (err) {
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

  launchAll();

  // เฝ้าดูอุปกรณ์ตลอดเวลา ไม่ให้โปรเซสดับ (ป้องกัน Terminate batch job)
  setInterval(() => {
    launchAll(true);
  }, 3000);
}

startEmulators();
