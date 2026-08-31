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

// พิกัดศูนย์กลาง มทส. (SUT Academic Ring Center - ใจกลางอาคารเรียนรวม มทส.)
export const SUT_DEFAULT_CENTER: LatLng = {
  lat: 14.88100,
  lng: 102.01650,
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
  if (normalized.includes('b1') || normalized.includes('เรียนรวม 1') || normalized.includes('เรียนรวม1') || normalized.includes('รวม 1')) {
    return SUT_LOCATIONS_MAP['อาคารเรียนรวม 1 (B1)'] || { lat: 14.880983, lng: 102.017208 };
  }
  if (normalized.includes('b2') || normalized.includes('เรียนรวม 2') || normalized.includes('เรียนรวม2') || normalized.includes('รวม 2')) {
    return SUT_LOCATIONS_MAP['อาคารเรียนรวม 2 (B2)'] || { lat: 14.881870, lng: 102.014977 };
  }
  if (normalized.includes('สมุด') || normalized.includes('บรรณสาร')) {
    return SUT_LOCATIONS_MAP['ศูนย์บรรณสารฯ (หอสมุดกลาง มทส.)'] || { lat: 14.878660, lng: 102.015913 };
  }
  if (normalized.includes('f1') || normalized.includes('f2') || normalized.includes('เครื่องมือ')) {
    return SUT_LOCATIONS_MAP['อาคารเครื่องมือวิทยาศาสตร์ฯ (F1 - F10)'] || { lat: 14.877862, lng: 102.017160 };
  }
  if (normalized.includes('วิศวะ') || normalized.includes('วิชาการ 1') || normalized.includes('วิชาการ1')) {
    return SUT_LOCATIONS_MAP['อาคารวิชาการ 1 (สำนักวิชาวิศวกรรมศาสตร์)'] || { lat: 14.878850, lng: 102.018770 };
  }
  if (normalized.includes('วิทย์') || normalized.includes('วิชาการ 2') || normalized.includes('วิชาการ2')) {
    return SUT_LOCATIONS_MAP['อาคารวิชาการ 2 (วิทย์ / แพทย์ / พยาบาล)'] || { lat: 14.879585, lng: 102.019869 };
  }
  if (normalized.includes('รัฐสีมา') || normalized.includes('รัฐสีมาคุณากร') || normalized.includes('พยาบาล')) {
    return SUT_LOCATIONS_MAP['อาคารรัฐสีมาคุณากร'] || { lat: 14.877714, lng: 102.014879 };
  }
  if (normalized.includes('technopolis') || normalized.includes('เทคโน')) {
    return SUT_LOCATIONS_MAP['เทคโนธานี'] || { lat: 14.876263, lng: 102.022375 };
  }
  if (normalized.includes('กาสะลอง') || (normalized.includes('อาหาร') && !normalized.includes('b2'))) {
    return SUT_LOCATIONS_MAP['โรงอาหารกาสะลองคำ'] || { lat: 14.896621, lng: 102.012748 };
  }
  if (normalized.includes('u-store') || normalized.includes('fresh me')) {
    return SUT_LOCATIONS_MAP['U-Store / Fresh Me @B1'] || { lat: 14.881748, lng: 102.016610 };
  }
  if (normalized.includes('บริหาร') || normalized.includes('อธิการ') || normalized.includes('reg')) {
    return SUT_LOCATIONS_MAP['อาคารบริหาร มทส. (สำนักงานอธิการบดี)'] || { lat: 14.880823, lng: 102.020922 };
  }
  if (normalized.includes('โรงพยาบาล') || normalized.includes('รพ.') || normalized.includes('แพทย์')) {
    return SUT_LOCATIONS_MAP['โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี (รพ.มทส.)'] || { lat: 14.864578, lng: 102.035497 };
  }
  if (normalized.includes('สุรเริงไชย') || normalized.includes('ยิม')) {
    return SUT_LOCATIONS_MAP['อาคารสุรเริงไชย (โรงยิมเนเซียมหลัก)'] || { lat: 14.886587, lng: 102.018495 };
  }
  if (normalized.includes('ฟิตเนส') || normalized.includes('สระว่ายน้ำ') || normalized.includes('สุขภาพ')) {
    return SUT_LOCATIONS_MAP['ศูนย์กีฬาและสุขภาพ (Fitness & สระว่ายน้ำ)'] || { lat: 14.886158, lng: 102.017971 };
  }
  if (normalized.includes('หอ 1') || normalized.includes('หอ 2') || normalized.includes('หอ 3') || normalized.includes('หอ 4') || normalized.includes('หอ 5') || normalized.includes('หอ 6') || normalized.includes('หญิง')) {
    return SUT_LOCATIONS_MAP['หอพักสุรนิเวศ 1 - 6 (หอพักหญิง)'] || { lat: 14.896847, lng: 102.014949 };
  }
  if (normalized.includes('หอ 7') || normalized.includes('หอ 8') || normalized.includes('หอ 9') || normalized.includes('หอ 10') || normalized.includes('หอ 11') || normalized.includes('หอ 12') || normalized.includes('หอ 13') || normalized.includes('ชาย')) {
    return SUT_LOCATIONS_MAP['หอพักสุรนิเวศ 7 - 13 (หอพักชาย)'] || { lat: 14.896259, lng: 102.009599 };
  }
  if (normalized.includes('หอ 14') || normalized.includes('หอ 15') || normalized.includes('หอ 16') || normalized.includes('หอ 17') || normalized.includes('หอ 18')) {
    return SUT_LOCATIONS_MAP['หอพักสุรนิเวศ 14 - 18 (หอพักหญิง)'] || { lat: 14.892740, lng: 102.012888 };
  }
  if (normalized.includes('จอดรถ')) {
    return SUT_LOCATIONS_MAP['ลานจอดรถอาคารเรียนรวม B1-B2'] || { lat: 14.882044, lng: 102.017504 };
  }
  if (normalized.includes('ประตู 1') || normalized.includes('ประตู1')) {
    return SUT_LOCATIONS_MAP['ประตู 1 มทส. (ฝั่ง ถ.มหาวิทยาลัย - ประตูหลัก)'] || { lat: 14.883852, lng: 102.024469 };
  }
  if (normalized.includes('ประตู 2') || normalized.includes('ประตู2')) {
    return SUT_LOCATIONS_MAP['ประตู 2 มทส. (ฝั่ง ถ.มิตรภาพ / โคกกรวด)'] || { lat: 14.862955, lng: 102.038860 };
  }
  if (normalized.includes('ประตู 3') || normalized.includes('ประตู3')) {
    return SUT_LOCATIONS_MAP['ประตู 3 มทส. (ฝั่ง ถ.304 - สุรนารีวิลเลจ)'] || { lat: 14.872608, lng: 102.008216 };
  }
  if (normalized.includes('ประตู 4') || normalized.includes('ประตู4') || normalized.includes('ห้วยยาง')) {
    return SUT_LOCATIONS_MAP['ประตู 4 มทส. (ฝั่ง อ่างห้วยยาง)'] || { lat: 14.901037, lng: 102.009148 };
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
