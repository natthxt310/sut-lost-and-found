import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { LightSensor } from 'expo-sensors';
import { ThemeColors, lightColors, darkColors } from '../theme/theme';

/**
 * =========================================================================
 * 🌙 ระบบจัดการธีม & เซ็นเซอร์วัดแสง (Dark Theme / LightSensor Context)
 * =========================================================================
 * 💡 อธิบายการทำงานแบบเข้าใจง่าย:
 * 1. ทำหน้าที่เป็น "ศูนย์กลางควบคุมสีทั้งแอป" (สว่าง / มืด)
 * 2. ☀️/🌙 สลับธีมอัตโนมัติตามความสว่างของห้องด้วย LightSensor (Ambient Light Sensor)
 * 3. 💾 จดจำการตั้งค่าลงเครื่อง (AsyncStorage)
 * =========================================================================
 */

const THEME_STORAGE_KEY = '@sut_lost_found_theme_v2';
const AUTO_LIGHT_STORAGE_KEY = '@sut_lost_found_auto_light_v2';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  autoLightSensor: boolean;
  toggleAutoLightSensor: () => void;
  currentLux: number | null;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
  autoLightSensor: false,
  toggleAutoLightSensor: () => {},
  currentLux: null,
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [autoLightSensor, setAutoLightSensor] = useState(false);
  const [currentLux, setCurrentLux] = useState<number | null>(null);

  // 🔄 โหลดการตั้งค่าธีมและเซ็นเซอร์วัดแสงจากเครื่อง
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [storedTheme, storedAutoLight] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(AUTO_LIGHT_STORAGE_KEY),
        ]);

        if (storedTheme === 'dark') {
          setIsDark(true);
        }
        if (storedAutoLight === 'true') {
          setAutoLightSensor(true);
        }
      } catch {
        // Silently use defaults
      }
    };
    loadSettings();
  }, []);

  // 💡 ตรวจจับระดับแสงรอบตัวด้วย LightSensor
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    if (autoLightSensor && Platform.OS === 'android') {
      try {
        LightSensor.setUpdateInterval(500);
        subscription = LightSensor.addListener(({ illuminance }) => {
          setCurrentLux(illuminance);

          // ถ้ามืด (< 20 lux) ให้เปลี่ยนเป็นโหมดมืดอัตโนมัติ
          // ถ้าสว่าง (> 35 lux) ให้เปลี่ยนเป็นโหมดสว่างอัตโนมัติ
          if (illuminance < 20) {
            setIsDark(true);
          } else if (illuminance > 35) {
            setIsDark(false);
          }
        });
      } catch {
        // LightSensor not supported
      }
    } else {
      setCurrentLux(null);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [autoLightSensor]);

  // 🔀 ฟังก์ชันสลับธีม สว่าง <-> มืด ด้วยตัวเอง
  const toggleTheme = async () => {
    const newValue = !isDark;
    setIsDark(newValue);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newValue ? 'dark' : 'light');
    } catch {
      // Silently fail
    }
  };

  // 💡 ฟังก์ชันเปิด/ปิด ระบบสลับธีมอัตโนมัติตามเซ็นเซอร์วัดแสง (Light Sensor)
  const toggleAutoLightSensor = async () => {
    const newValue = !autoLightSensor;
    setAutoLightSensor(newValue);
    try {
      await AsyncStorage.setItem(AUTO_LIGHT_STORAGE_KEY, newValue ? 'true' : 'false');
    } catch {
      // Silently fail
    }
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        colors,
        isDark,
        toggleTheme,
        autoLightSensor,
        toggleAutoLightSensor,
        currentLux,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  return context;
};
