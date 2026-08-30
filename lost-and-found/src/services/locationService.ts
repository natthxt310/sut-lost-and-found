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

// พิกัด GPS จริงของสถานที่ใน มทส. (Suranaree University of Technology)
export const SUT_LOCATIONS_MAP: Record<string, LatLng> = {
  'อาคารเรียนรวม 1 (B1)': { lat: 14.88350, lng: 102.02100 },
  'อาคารเรียนรวม 2 (B2)': { lat: 14.88280, lng: 102.02150 },
  'ศูนย์บรรณสารและสื่อการศึกษา (หอสมุด)': { lat: 14.88200, lng: 102.02050 },
  'โรงอาหารสุรนิเวศน์ (กาสะลอง)': { lat: 14.88120, lng: 102.01950 },
  'โรงอาหารเรียนรวม 2': { lat: 14.88250, lng: 102.02180 },
  'อาคารบริหาร มทส.': { lat: 14.88400, lng: 102.01980 },
  'U-Store / Fresh Me': { lat: 14.88320, lng: 102.02080 },
  'กาแฟพันธุ์ไทย @B1': { lat: 14.88360, lng: 102.02090 },
  'อาคารวิชาการ 1-2': { lat: 14.88150, lng: 102.02200 },
  'หอพักสุรนิเวศ': { lat: 14.88000, lng: 102.01800 },
  'ลานจอดรถ มทส.': { lat: 14.88220, lng: 102.02250 },
};

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

  const normalized = locationName.toLowerCase();

  for (const [key, coords] of Object.entries(SUT_LOCATIONS_MAP)) {
    if (normalized.includes(key.toLowerCase())) {
      return coords;
    }
  }

  // Matching by Keywords
  if (normalized.includes('b2') || normalized.includes('รวม 2') || normalized.includes('รวม2')) {
    return SUT_LOCATIONS_MAP['อาคารเรียนรวม 2 (B2)'];
  }
  if (normalized.includes('b1') || normalized.includes('รวม 1') || normalized.includes('รวม1')) {
    return SUT_LOCATIONS_MAP['อาคารเรียนรวม 1 (B1)'];
  }
  if (normalized.includes('สมุด') || normalized.includes('บรรณสาร')) {
    return SUT_LOCATIONS_MAP['ศูนย์บรรณสารและสื่อการศึกษา (หอสมุด)'];
  }
  if (normalized.includes('อาหาร') || normalized.includes('กาสะลอง')) {
    return SUT_LOCATIONS_MAP['โรงอาหารสุรนิเวศน์ (กาสะลอง)'];
  }
  if (normalized.includes('u-store') || normalized.includes('fresh me')) {
    return SUT_LOCATIONS_MAP['U-Store / Fresh Me'];
  }
  if (normalized.includes('บริหาร')) {
    return SUT_LOCATIONS_MAP['อาคารบริหาร มทส.'];
  }
  if (normalized.includes('หอพัก')) {
    return SUT_LOCATIONS_MAP['หอพักสุรนิเวศ'];
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
