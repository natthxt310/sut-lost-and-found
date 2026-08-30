import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';

/**
 * =========================================================================
 * 📳 Hook สำหรับตรวจจับการเขย่าเครื่อง (Accelerometer Shake Sensor)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * อ่านค่าความเร่ง 3 แกน (X, Y, Z) จาก Accelerometer Sensor ในโทรศัพท์
 * เมื่อผู้ใช้เขย่าเครื่อง (แรงเหวี่ยง > 1.85g) จะเรียกฟังก์ชัน onShake และสั่นเตือน (Haptics)
 * =========================================================================
 */

export const useShakeSensor = (onShake: () => void, enabled: boolean = true) => {
  const lastShakeTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // ตั้งค่าความถี่ในการอ่านค่าเซ็นเซอร์ (ทุกๆ 150ms)
    Accelerometer.setUpdateInterval(150);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      // คำนวณขนาดแรงเหวี่ยงรวม (G-Force Magnitude)
      const gForce = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      // ตรวจสอบว่าแรงเหวี่ยงเกินเกณฑ์ และไม่อยู่ในจังหวะคูลดาวน์ (เว้นช่วง 2 วินาที)
      if (gForce > 1.85 && now - lastShakeTime.current > 2000) {
        lastShakeTime.current = now;

        // สั่นเครื่องเตือนผ่าน Haptic Motor
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {
          // Silently ignore on unsupported platforms
        }

        // รันฟังก์ชันเมื่อเขย่า
        onShake();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onShake, enabled]);
};
