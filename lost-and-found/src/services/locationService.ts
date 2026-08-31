import * as Location from 'expo-location';

/**
 * =========================================================================
 * 📍 บริการพิกัดและคำนวณระยะทางจริง (Real GPS & SUT Location Service)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. กำหนดพิกัด GPS จริงของอาคารและสถานที่สำคัญในมหาวิทยาลัยเทคโนโลยีสุรนารี (มทส.)
 * 2. ใช้สูตร Haversine Formula คำนวณระยะห่างตามภูมิศาสตร์จริงจากตำแหน่ง GPS ของผู้ใช้
 * 3. ดึงพิกัดปัจจุบันผ่าน Location Hardware Sensor (GPS)
 * =========================================================================
 */

export interface LatLng {
  lat: number;
  lng: number;
}

import { SUT_LOCATIONS_DATA } from '../data/locationsData';

// พิกัด GPS จริงของสถานที่ใน มทส. ทั้งหมด 28+ แห่ง
export const SUT_LOCATIONS_MAP: Record<string, LatLng> = SUT_LOCATIONS_DATA.reduce(
  (acc, item) => {
    acc[item.name] = item.coords;
    return acc;
  },
  {} as Record<string, LatLng>
);

// พิกัดศูนย์กลาง มทส. (SUT Main Campus Center)
export const SUT_DEFAULT_CENTER: LatLng = {
  lat: 14.88210,
  lng: 102.02070,
};

/**
 * ดึงพิกัด GPS จากชื่อสถานที่
 */
export const getLocationCoords = (locationName: string): LatLng => {
  if (!locationName) return SUT_DEFAULT_CENTER;

  const normalized = locationName.toLowerCase().trim();

  // 1. Exact or Partial Match
  for (const [key, coords] of Object.entries(SUT_LOCATIONS_MAP)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return coords;
    }
  }

  // 2. Matching by Keywords across all SUT areas
  if (normalized.includes('b2') || normalized.includes('รวม 2') || normalized.includes('รวม2')) {
    return SUT_LOCATIONS_MAP['อาคารเรียนรวม 2 (B2)'] || { lat: 14.88280, lng: 102.02150 };
  }
  if (normalized.includes('b1') || normalized.includes('รวม 1') || normalized.includes('รวม1')) {
    return SUT_LOCATIONS_MAP['อาคารเรียนรวม 1 (B1)'] || { lat: 14.88350, lng: 102.02100 };
  }
  if (normalized.includes('สมุด') || normalized.includes('บรรณสาร')) {
    return SUT_LOCATIONS_MAP['ศูนย์บรรณสารฯ (หอสมุดกลาง มทส.)'] || { lat: 14.88200, lng: 102.02050 };
  }
  if (normalized.includes('กาสะลอง') || (normalized.includes('อาหาร') && !normalized.includes('b2'))) {
    return SUT_LOCATIONS_MAP['โรงอาหารสุรนิเวศน์ (กาสะลอง)'] || { lat: 14.88120, lng: 102.01950 };
  }
  if (normalized.includes('u-store') || normalized.includes('fresh me')) {
    return SUT_LOCATIONS_MAP['U-Store / Fresh Me @B1'] || { lat: 14.88320, lng: 102.02080 };
  }
  if (normalized.includes('บริหาร') || normalized.includes('อธิการ') || normalized.includes('reg')) {
    return SUT_LOCATIONS_MAP['อาคารบริหาร มทส. (สำนักงานอธิการบดี)'] || { lat: 14.88400, lng: 102.01980 };
  }
  if (normalized.includes('โรงพยาบาล') || normalized.includes('รพ.') || normalized.includes('แพทย์')) {
    return SUT_LOCATIONS_MAP['โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี (รพ.มทส.)'] || { lat: 14.87450, lng: 102.01450 };
  }
  if (normalized.includes('สุรเริงไชย') || normalized.includes('ยิม') || normalized.includes('กีฬา')) {
    return SUT_LOCATIONS_MAP['อาคารสุรเริงไชย (โรงยิมเนเซียมหลัก)'] || { lat: 14.88580, lng: 102.02250 };
  }
  if (normalized.includes('หอพัก') || normalized.includes('สุรนิเวศ')) {
    return SUT_LOCATIONS_MAP['หอพักสุรนิเวศ 1 - 4 (หอพักชาย)'] || { lat: 14.88000, lng: 102.01800 };
  }
  if (normalized.includes('จอดรถ')) {
    return SUT_LOCATIONS_MAP['ลานจอดรถอาคารเรียนรวม B1-B2'] || { lat: 14.88310, lng: 102.02220 };
  }

  return SUT_DEFAULT_CENTER;
};

/**
 * คำนวณระยะทางจริงตามแนวเส้นรุ้ง-เส้นแวง (Haversine Formula) หน่วยเป็นเมตร
 */
export const calculateRealDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // รัศมีโลกเฉลี่ยในหน่วยเมตร
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * จัดรูปแบบระยะทางสำหรับแสดงผลใน UI
 * ตัวอย่าง: 15 เมตร, 120 เมตร, 1.4 กม.
 */
export const formatRealDistance = (meters: number): string => {
  if (meters < 1000) {
    const rounded = Math.max(5, Math.round(meters));
    return `${rounded} เมตร`;
  }
  return `${(meters / 1000).toFixed(1)} กม.`;
};

/**
 * ดึงพิกัด GPS ปัจจุบันของผู้ใช้จากฮาร์ดแวร์ Location Sensor
 */
export const getCurrentUserGpsLocation = async (): Promise<LatLng> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return SUT_DEFAULT_CENTER;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
    };
  } catch (error) {
    return SUT_DEFAULT_CENTER;
  }
};
