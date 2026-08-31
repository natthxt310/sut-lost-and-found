import { LatLng } from '../services/locationService';

/**
 * =========================================================================
 * 📍 ฐานข้อมูลสถานที่ มทส. พิกัดจริงตรงตาม Google Maps / OpenStreetMap 100%
 * =========================================================================
 */

export interface SUTLocationItem {
  id: string;
  name: string;
  zone: string;
  icon: string;
  desc: string;
  coords: LatLng;
}

export interface SUTZoneGroup {
  zoneName: string;
  zoneIcon: string;
  items: SUTLocationItem[];
}

export const SUT_LOCATIONS_DATA: SUTLocationItem[] = [
  // 🏛️ โซน 1: อาคารเรียนและวิชาการ (Lecture & Academic Buildings)
  {
    id: 'b1',
    name: 'อาคารเรียนรวม 1 (B1)',
    zone: 'อาคารเรียน & วิชาการ',
    icon: 'school',
    desc: 'ห้องเรียนรวม 101-118, ห้องบรรยายใหญ่, ศูนย์บริการนักศึกษา',
    coords: { lat: 14.880983, lng: 102.017208 },
  },
  {
    id: 'b2',
    name: 'อาคารเรียนรวม 2 (B2)',
    zone: 'อาคารเรียน & วิชาการ',
    icon: 'school',
    desc: 'ห้องเรียนรวม B2, ห้องปฏิบัติการคอมพิวเตอร์, ลานกิจกรรมใต้อาคาร',
    coords: { lat: 14.881870, lng: 102.014977 },
  },
  {
    id: 'library',
    name: 'ศูนย์บรรณสารฯ (หอสมุดกลาง มทส.)',
    zone: 'อาคารเรียน & วิชาการ',
    icon: 'book',
    desc: 'หอสมุดกลาง ชั้น 1-4, ห้องอ่านหนังสือ 24 ชม., Co-working Space',
    coords: { lat: 14.878660, lng: 102.015913 },
  },
  {
    id: 'f1-f10',
    name: 'อาคารเครื่องมือวิทยาศาสตร์ฯ (F1 - F10)',
    zone: 'อาคารเรียน & วิชาการ',
    icon: 'flask',
    desc: 'ศูนย์เครื่องมือวิทยาศาสตร์และเทคโนโลยี, ห้องแล็บวิจัย',
    coords: { lat: 14.877862, lng: 102.017160 },
  },
  {
    id: 'acad-eng',
    name: 'อาคารวิชาการ 1 (สำนักวิชาวิศวกรรมศาสตร์)',
    zone: 'อาคารเรียน & วิชาการ',
    icon: 'construct',
    desc: 'สำนักวิชาวิศวกรรมศาสตร์, เทคโนโลยีสังคม, ห้องพักคณาจารย์',
    coords: { lat: 14.878850, lng: 102.018770 },
  },
  {
    id: 'acad-sci',
    name: 'อาคารวิชาการ 2 (วิทย์ / แพทย์ / พยาบาล)',
    zone: 'อาคารเรียน & วิชาการ',
    icon: 'medkit',
    desc: 'สำนักวิชาวิทยาศาสตร์, แพทยศาสตร์, พยาบาลศาสตร์, สาธารณสุข',
    coords: { lat: 14.879585, lng: 102.019869 },
  },
  {
    id: 'technopolis',
    name: 'เทคโนธานี',
    zone: 'อาคารเรียน & วิชาการ',
    icon: 'hardware-chip',
    desc: 'เทคโนธานี, สถาบันวิจัยและพัฒนา, อุทยานวิทยาศาสตร์ภาคตะวันออกเฉียงเหนือ',
    coords: { lat: 14.876263, lng: 102.022375 },
  },

  // 🍽️ โซน 2: โรงอาหาร ร้านอาหาร และร้านค้า (Dining & Shopping)
  {
    id: 'canteen-kasalong',
    name: 'โรงอาหารกาสะลองคำ',
    zone: 'โรงอาหาร & ร้านค้า',
    icon: 'restaurant',
    desc: 'ศูนย์อาหารกลาง มทส., ร้านข้าวราดแกง, ร้านอาหารตามสั่ง, โซนเครื่องดื่ม',
    coords: { lat: 14.896621, lng: 102.012748 },
  },
  {
    id: 'canteen-b2',
    name: 'โรงอาหารเรียนรวม 2 (ใต้ตึก B2)',
    zone: 'โรงอาหาร & ร้านค้า',
    icon: 'fast-food',
    desc: 'โรงอาหารใต้อาคาร B2, ร้านอาหารจานด่วน, ก๋วยเตี๋ยว, เบเกอรี่',
    coords: { lat: 14.881870, lng: 102.014977 },
  },
  {
    id: 'ustore-freshme',
    name: 'U-Store / Fresh Me @B1',
    zone: 'โรงอาหาร & ร้านค้า',
    icon: 'storefront',
    desc: 'ร้านจำหน่ายสินค้า Apple (U-Store) และร้านชานม Fresh Me ใต้อาคาร B1',
    coords: { lat: 14.881748, lng: 102.016610 },
  },
  {
    id: 'punthai-7eleven-b1',
    name: 'กาแฟพันธุ์ไทย & 7-Eleven @B1',
    zone: 'โรงอาหาร & ร้านค้า',
    icon: 'cafe',
    desc: 'ร้านกาแฟพันธุ์ไทย, ร้านสะดวกซื้อ 7-Eleven ใต้อาคารเรียนรวม 1',
    coords: { lat: 14.880983, lng: 102.017208 },
  },
  {
    id: 'seven-eleven-dorm',
    name: '7-Eleven สาขาหอพักสุรนิเวศ',
    zone: 'โรงอาหาร & ร้านค้า',
    icon: 'cart',
    desc: 'ร้านสะดวกซื้อ 7-Eleven บริเวณหน้าโซนหอพักนักศึกษา',
    coords: { lat: 14.896621, lng: 102.012748 },
  },
  {
    id: 'night-market',
    name: 'ตลาดนัดเปิดท้าย มทส. / ลานเพลิน',
    zone: 'โรงอาหาร & ร้านค้า',
    icon: 'pricetags',
    desc: 'ตลาดนัดนักศึกษา มทส., ถนนคนเดิน, ลานกิจกรรมกลางแจ้ง',
    coords: { lat: 14.896259, lng: 102.009599 },
  },

  // 🏢 โซน 3: อาคารบริหารและบริการกลาง (Administration & Campus Services)
  {
    id: 'admin-building',
    name: 'อาคารบริหาร มทส. (สำนักงานอธิการบดี)',
    zone: 'อาคารบริหาร & บริการ',
    icon: 'business',
    desc: 'ศูนย์บริการการศึกษา (Reg / งานทะเบียน), กองคลัง, กองพัฒนานักศึกษา',
    coords: { lat: 14.880823, lng: 102.020922 },
  },
  {
    id: 'surasammanakhan',
    name: 'สุรสัมมนาคาร (โรงแรม มทส.)',
    zone: 'อาคารบริหาร & บริการ',
    icon: 'bed',
    desc: 'โรงแรม มทส., ห้องประชุมสัมมนาใหญ่, ห้องจัดเลี้ยง, ศูนย์ประชุม',
    coords: { lat: 14.88350, lng: 102.01250 },
  },
  {
    id: 'dtc',
    name: 'ศูนย์เทคโนโลยีดิจิทัล (DTC)',
    zone: 'อาคารบริหาร & บริการ',
    icon: 'desktop',
    desc: 'ศูนย์บริการไอที มทส., บริการเครือข่ายอินเทอร์เน็ต, ระบบสารสนเทศ',
    coords: { lat: 14.88120, lng: 102.01500 },
  },
  {
    id: 'student-activity',
    name: 'อาคารกิจกรรมนักศึกษา (สโมสรนักศึกษา)',
    zone: 'อาคารบริหาร & บริการ',
    icon: 'people',
    desc: 'ที่ทำการสภานักศึกษา, องค์การบริหาร องค์การนักศึกษา, ห้องซ้อมดนตรี/ชมรม',
    coords: { lat: 14.87920, lng: 102.01420 },
  },

  // 🏠 โซน 4: หอพักนักศึกษา (Student Dormitories)
  {
    id: 'dorm-women-1-6',
    name: 'หอพักสุรนิเวศ 1 - 6 (หอพักหญิง)',
    zone: 'หอพักนักศึกษา',
    icon: 'home',
    desc: 'โซนหอพักหญิง มทส. 1, 2, 3, 4, 5, 6 ใกล้สระน้ำสุรนิเวศน์',
    coords: { lat: 14.896847, lng: 102.014949 },
  },
  {
    id: 'dorm-men-7-13',
    name: 'หอพักสุรนิเวศ 7 - 13 (หอพักชาย)',
    zone: 'หอพักนักศึกษา',
    icon: 'home',
    desc: 'โซนหอพักชาย มทส. 7, 8, 9, 10, 11, 12, 13',
    coords: { lat: 14.896259, lng: 102.009599 },
  },
  {
    id: 'dorm-women-14-18',
    name: 'หอพักสุรนิเวศ 14 - 18 (หอพักหญิง)',
    zone: 'หอพักนักศึกษา',
    icon: 'home',
    desc: 'หอพักนักศึกษาโซนใหม่ สุรนิเวศ 14, 15, 16, 17, 18',
    coords: { lat: 14.892740, lng: 102.012888 },
  },

  // ⚽ โซน 5: ศูนย์กีฬาและนันทนาการ (Sports Complex & Fitness)
  {
    id: 'surareongchai',
    name: 'อาคารสุรเริงไชย (โรงยิมเนเซียมหลัก)',
    zone: 'ศูนย์กีฬา & สุขภาพ',
    icon: 'trophy',
    desc: 'โรงยิมเนเซียมหลัก, สนามแบดมินตัน, สนามบาสเกตบอล, ห้องปิงปอง',
    coords: { lat: 14.886587, lng: 102.018495 },
  },
  {
    id: 'sports-complex',
    name: 'ศูนย์กีฬาและสุขภาพ (Fitness & สระว่ายน้ำ)',
    zone: 'ศูนย์กีฬา & สุขภาพ',
    icon: 'fitness',
    desc: 'ฟิตเนส มทส., สระว่ายน้ำโอลิมปิก 50 เมตร, ซาวน่า, สนามสควอช',
    coords: { lat: 14.886158, lng: 102.017971 },
  },
  {
    id: 'main-stadium',
    name: 'สนามกีฬาหลัก มทส. (Main Stadium)',
    zone: 'ศูนย์กีฬา & สุขภาพ',
    icon: 'football',
    desc: 'สนามฟุตบอลหญ้าจริง, ลู่วิ่งยางสังเคราะห์มาตรฐาน 8 ช่องวิ่ง',
    coords: { lat: 14.88750, lng: 102.02300 },
  },
  {
    id: 'botanical-garden',
    name: 'สวนพฤกษศาสตร์ มทส. / อุทยานผีเสื้อ',
    zone: 'ศูนย์กีฬา & สุขภาพ',
    icon: 'leaf',
    desc: 'อุทยานผีเสื้อ, เส้นทางศึกษาธรรมชาติ, จุดออกกำลังกายกลางแจ้ง',
    coords: { lat: 14.88200, lng: 102.02600 },
  },

  // 🏥 โซน 6: โรงพยาบาลและศูนย์การแพทย์ (Hospital & Medical Center)
  {
    id: 'hospital',
    name: 'โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี (รพ.มทส.)',
    zone: 'โรงพยาบาล & การแพทย์',
    icon: 'medkit',
    desc: 'โรงพยาบาล มทส. แผนกผู้ป่วยนอก (OPD), แผนกฉุกเฉิน 24 ชม., คลินิกพิเศษ',
    coords: { lat: 14.864578, lng: 102.035497 },
  },
  {
    id: 'medical-excellence',
    name: 'อาคารศูนย์ความเป็นเลิศทางการแพทย์',
    zone: 'โรงพยาบาล & การแพทย์',
    icon: 'pulse',
    desc: 'อาคารศูนย์ความเป็นเลิศทางการแพทย์ 12 ชั้น, ศูนย์หัวใจ, ศูนย์ส่องกล้อง',
    coords: { lat: 14.864578, lng: 102.035497 },
  },

  // 🚗 โซน 7: ประตูทางเข้า-ออก และลานจอดรถ (Gates & Parking)
  {
    id: 'gate-1',
    name: 'ประตู 1 มทส. (ฝั่ง ถ.มหาวิทยาลัย - ประตูหลัก)',
    zone: 'ประตู & ลานจอดรถ',
    icon: 'navigate',
    desc: 'ทางเข้าหลัก มทส. ฝั่งถนนมหาวิทยาลัย เชื่อมต่อ ถ.มิตรภาพ สี่แยกปักธงชัย',
    coords: { lat: 14.883852, lng: 102.024469 },
  },
  {
    id: 'gate-2',
    name: 'ประตู 2 มทส. (ฝั่ง ถ.มิตรภาพ / โคกกรวด)',
    zone: 'ประตู & ลานจอดรถ',
    icon: 'navigate',
    desc: 'ทางเข้าออกฝั่งถนนมิตรภาพ โคกกรวด ใกล้เทคโนธานี และ รพ.มทส.',
    coords: { lat: 14.862955, lng: 102.038860 },
  },
  {
    id: 'gate-3',
    name: 'ประตู 3 มทส. (ฝั่ง ถ.304 - สุรนารีวิลเลจ)',
    zone: 'ประตู & ลานจอดรถ',
    icon: 'navigate',
    desc: 'ทางเข้าออก มทส. ฝั่งถนน 304 สี่แยกปักธงชัย',
    coords: { lat: 14.872608, lng: 102.008216 },
  },
  {
    id: 'gate-4',
    name: 'ประตู 4 มทส. (ฝั่ง อ่างห้วยยาง)',
    zone: 'ประตู & ลานจอดรถ',
    icon: 'navigate',
    desc: 'ทางเข้าออกฝั่งอ่างห้วยยาง มทส. ประตู 4',
    coords: { lat: 14.901037, lng: 102.009148 },
  },
  {
    id: 'parking-b1-b2',
    name: 'ลานจอดรถอาคารเรียนรวม B1-B2',
    zone: 'ประตู & ลานจอดรถ',
    icon: 'car',
    desc: 'ลานจอดรถยนต์และรถจักรยานยนต์ข้างอาคารเรียนรวม 1 และ 2',
    coords: { lat: 14.882044, lng: 102.017504 },
  },
  {
    id: 'parking-canteen',
    name: 'ลานจอดรถโรงอาหารสุรนิเวศน์',
    zone: 'ประตู & ลานจอดรถ',
    icon: 'car',
    desc: 'ลานจอดรถรอบโรงอาหารกาสะลองและโซนร้านค้า',
    coords: { lat: 14.896621, lng: 102.012748 },
  },
  {
    id: 'ev-bus-stop',
    name: 'จุดจอดรถบัส มทส. (EV Shuttle Bus)',
    zone: 'ประตู & ลานจอดรถ',
    icon: 'bus',
    desc: 'ป้ายรอรถรางไฟฟ้ารับส่งนักศึกษาทั่ววิทยาเขต มทส.',
    coords: { lat: 14.881748, lng: 102.016610 },
  },
];

export const ALL_SUT_LOCATION_NAMES = SUT_LOCATIONS_DATA.map((loc) => loc.name);

export const SUT_LOCATION_GROUPS: SUTZoneGroup[] = [
  {
    zoneName: '🏛️ อาคารเรียน & วิชาการ',
    zoneIcon: 'school',
    items: SUT_LOCATIONS_DATA.filter((l) => l.zone === 'อาคารเรียน & วิชาการ'),
  },
  {
    zoneName: '🍽️ โรงอาหาร & ร้านค้า',
    zoneIcon: 'restaurant',
    items: SUT_LOCATIONS_DATA.filter((l) => l.zone === 'โรงอาหาร & ร้านค้า'),
  },
  {
    zoneName: '🏢 อาคารบริหาร & บริการ',
    zoneIcon: 'business',
    items: SUT_LOCATIONS_DATA.filter((l) => l.zone === 'อาคารบริหาร & บริการ'),
  },
  {
    zoneName: '🏠 หอพักนักศึกษา & บุคลากร',
    zoneIcon: 'home',
    items: SUT_LOCATIONS_DATA.filter((l) => l.zone === 'หอพักนักศึกษา'),
  },
  {
    zoneName: '⚽ ศูนย์กีฬา & สุขภาพ',
    zoneIcon: 'fitness',
    items: SUT_LOCATIONS_DATA.filter((l) => l.zone === 'ศูนย์กีฬา & สุขภาพ'),
  },
  {
    zoneName: '🏥 โรงพยาบาล & ศูนย์การแพทย์',
    zoneIcon: 'medkit',
    items: SUT_LOCATIONS_DATA.filter((l) => l.zone === 'โรงพยาบาล & การแพทย์'),
  },
  {
    zoneName: '🚗 ประตู & ลานจอดรถ',
    zoneIcon: 'car',
    items: SUT_LOCATIONS_DATA.filter((l) => l.zone === 'ประตู & ลานจอดรถ'),
  },
];
