import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, lightColors, darkColors } from '../theme/theme';

/**
 * =========================================================================
 * 🌙 ระบบจัดการธีม (Dark Theme / Light Theme Context)
 * =========================================================================
 * 💡 อธิบายการทำงานแบบเข้าใจง่าย:
 * ทำหน้าที่เป็น "ศูนย์กลางควบคุมสีทั้งแอป"
 * 
 * 📌 ความสามารถ:
 * 1. จดจำการตั้งค่าลงหน่วยความจำเครื่อง (AsyncStorage) ปิดแอปแล้วเปิดใหม่ยังจำโหมดเดิมได้
 * 2. ฟังก์ชัน `toggleTheme()` สำหรับสลับระหว่าง "โหมดสว่าง ☀️" กับ "โหมดมืด 🌙"
 * 3. แจกจ่ายชุดสี (`colors`) ไปให้ทุกหน้าจอและทุก Component นำไปใช้งานได้ทันที
 * =========================================================================
 */

// คีย์สำหรับบันทึกการตั้งค่าธีมลงในเครื่อง
const THEME_STORAGE_KEY = '@sut_lost_found_theme_v1';

interface ThemeContextType {
  colors: ThemeColors;    // รวบรวมชุดสีปัจจุบัน (สว่าง หรือ มืด)
  isDark: boolean;        // โหมดมืดเปิดอยู่หรือไม่ (true/false)
  toggleTheme: () => void;// ฟังก์ชันสำหรับกดสลับธีม
}

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  // 🔄 โหลดการตั้งค่าธีมที่เคยบันทึกไว้ทันทีที่เปิดแอปขึ้นมา
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'dark') {
          setIsDark(true);
        }
      } catch {
        // หากโหลดไม่ได้ให้ใช้ Light Mode เป็นค่าเริ่มต้น
      }
    };
    loadTheme();
  }, []);

  // 🔀 ฟังก์ชันสลับธีม สว่าง <-> มืด พร้อมบันทึกลงเครื่อง
  const toggleTheme = async () => {
    const newValue = !isDark;
    setIsDark(newValue);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newValue ? 'dark' : 'light');
    } catch {
      // Silently fail
    }
  };

  // เลือกชุดสีตามโหมดที่เปิดอยู่
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook สำหรับเรียกใช้งานธีมในหน้าจอต่างๆ เช่น const { colors, isDark } = useTheme();
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  return context;
};
