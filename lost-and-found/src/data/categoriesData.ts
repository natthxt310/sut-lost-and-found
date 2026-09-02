/**
 * =========================================================================
 * 🏷️ ฐานข้อมูลหมวดหมู่และแท็กสิ่งของ มทส. (Comprehensive SUT Category Data)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * รวมหมวดหมู่และแท็กสิ่งของที่ครอบคลุมทุกการใช้งานในชีวิตประจำวันของนักศึกษา มทส.
 * =========================================================================
 */

export interface SUTCategoyItem {
  id: string;
  name: string;
  icon: string;
  subtags: string[];
}

export const SUT_CATEGORIES: SUTCategoyItem[] = [
  {
    id: 'phone',
    name: 'โทรศัพท์ & แท็บเล็ต',
    icon: 'phone-portrait',
    subtags: ['iPhone', 'iPad', 'Samsung', 'เคสโทรศัพท์', 'ปากกา iPad (Stylus)', 'Android Tablet'],
  },
  {
    id: 'audio',
    name: 'หูฟัง & AirPods',
    icon: 'headset',
    subtags: ['AirPods', 'เคส AirPods', 'หูฟังบลูทูธ', 'หูฟังมีสาย', 'Headphone ครอบหู'],
  },
  {
    id: 'it',
    name: 'โน้ตบุ๊ก & อุปกรณ์ IT',
    icon: 'laptop-outline',
    subtags: ['MacBook', 'โน้ตบุ๊ก Gaming', 'เมาส์ / คีย์บอร์ด', 'แฟลชไดรฟ์ (USB)', 'ฮาร์ดดิสก์พกพา'],
  },
  {
    id: 'power',
    name: 'พาวเวอร์แบงค์ & สายชาร์จ',
    icon: 'battery-charging-outline',
    subtags: ['พาวเวอร์แบงค์', 'สายชาร์จ iPhone', 'สาย Type-C', 'หัวชาร์จ / อะแดปเตอร์', 'ปลั๊กพ่วง'],
  },
  {
    id: 'id-card',
    name: 'บัตรนักศึกษา & บัตรประชาชน',
    icon: 'card',
    subtags: ['บัตรนักศึกษา มทส.', 'บัตรประชาชน', 'ใบขับขี่', 'สายคล้องคอ มทส.'],
  },
  {
    id: 'bank-card',
    name: 'บัตร ATM & บัตรเครดิต',
    icon: 'card-outline',
    subtags: ['บัตร ATM ไทยพาณิชย์', 'บัตรกสิกรไทย', 'บัตรกรุงไทย', 'บัตรกรุงเทพ', 'บัตร 7-Eleven'],
  },
  {
    id: 'wallet',
    name: 'กระเป๋าสตางค์',
    icon: 'wallet-outline',
    subtags: ['กระเป๋าเงินใบยาว', 'กระเป๋าสตางค์พับ', 'กระเป๋าเหรียญ', 'กระเป๋าใส่บัตร (Card Holder)'],
  },
  {
    id: 'bag',
    name: 'กระเป๋าเป้ & ถุงผ้า',
    icon: 'bag',
    subtags: ['กระเป๋าเป้สะพายหลัง', 'กระเป๋าสะพายข้าง', 'ถุงผ้ามหาวิทยาลัย', 'กระเป๋าใส่โน้ตบุ๊ก'],
  },
  {
    id: 'vehicle-key',
    name: 'กุญแจรถมอเตอร์ไซค์ / รถยนต์',
    icon: 'key',
    subtags: ['กุญแจ Honda Wave / Scoopy', 'กุญแจ Yamaha', 'กุญแจรีโมทรถยนต์', 'พวงกุญแจ'],
  },
  {
    id: 'room-key',
    name: 'กุญแจห้อง & คีย์การ์ด',
    icon: 'key-outline',
    subtags: ['คีย์การ์ดหอพักสุรนิเวศ', 'กุญแจห้องพัก', 'กุญแจล็อกเกอร์', 'คีย์การ์ดหอนอก'],
  },
  {
    id: 'helmet',
    name: 'หมวกกันน็อก',
    icon: 'shield-checkmark-outline',
    subtags: ['หมวกกันน็อกเต็มใบ', 'หมวกกันน็อกครึ่งใบ', 'หมวกแก๊ป', 'หมวกบักเก็ต'],
  },
  {
    id: 'glasses',
    name: 'แว่นตา & แว่นกันแดด',
    icon: 'glasses-outline',
    subtags: ['แว่นสายตา', 'แว่นกรองแสง', 'แว่นกันแดด', 'กล่องแว่นตา'],
  },
  {
    id: 'clothes',
    name: 'เสื้อผ้า & เสื้อช็อป',
    icon: 'shirt',
    subtags: ['เสื้อช็อปวิศวะ', 'เสื้อกาวน์', 'เสื้อกันหนาว / ฮู้ด', 'ชุดนักศึกษา', 'เสื้อกีฬา มทส.'],
  },
  {
    id: 'umbrella',
    name: 'ร่ม & เสื้อกันฝน',
    icon: 'umbrella-outline',
    subtags: ['ร่มพับ', 'ร่มยาว', 'เสื้อกันฝน'],
  },
  {
    id: 'bottle',
    name: 'ขวดน้ำ & แก้วเก็บความเย็น',
    icon: 'cafe-outline',
    subtags: ['แก้ว Tyeso', 'แก้ว Stanley', 'แก้ว Yeti', 'กระบอกน้ำพกพา'],
  },
  {
    id: 'stationery',
    name: 'เครื่องเขียน & หนังสือเรียน',
    icon: 'pencil-outline',
    subtags: ['กล่องดินสอ', 'เครื่องคิดเลขวิทยาศาสตร์', 'ชีทสรุป / เอกสารเรียน', 'หนังสือหอสมุด'],
  },
  {
    id: 'personal',
    name: 'ของใช้ส่วนตัว & ยา',
    icon: 'medkit-outline',
    subtags: ['กระเป๋าเครื่องสำอาง', 'ยาดม / ยาประจำตัว', 'ลิปสติก', 'หวี / กระจกพกพา'],
  },
  {
    id: 'other',
    name: 'อื่นๆ',
    icon: 'ellipsis-horizontal',
    subtags: ['อุปกรณ์กีฬา', 'ของเล่น / โมเดล', 'อื่นๆ ที่ไม่ได้ระบุ'],
  },
];

// รายการหมวดหมู่แบบ String Array สำหรับ Dropdown
export const CATEGORY_DROPDOWN_OPTIONS = SUT_CATEGORIES.map((c) => c.name);

// รายการแท็กยอดนิยมสำหรับปุ่ม Quick Tag Chips ในหน้าค้นหา
export const POPULAR_TAG_CHIPS = [
  'ทั้งหมด',
  'โทรศัพท์ & แท็บเล็ต',
  'หูฟัง & AirPods',
  'โน้ตบุ๊ก & อุปกรณ์ IT',
  'บัตรนักศึกษา & บัตรประชาชน',
  'กระเป๋าสตางค์',
  'กระเป๋าเป้ & ถุงผ้า',
  'กุญแจรถ',
  'คีย์การ์ดหอพัก',
  'หมวกกันน็อก',
  'แว่นตา',
  'เสื้อช็อป / เสื้อผ้า',
  'แก้วเก็บความเย็น',
  'ร่ม & เสื้อกันฝน',
  'เครื่องเขียน & หนังสือ',
];

// รายการโทนสีสำหรับเลือกในหน้าสร้างโพสต์และตัวกรอง
export interface SUTColorOption {
  name: string;
  hex: string;
  border?: string;
}

export const SUT_COLOR_OPTIONS: SUTColorOption[] = [
  { name: 'ดำ', hex: '#1E293B' },
  { name: 'ขาว', hex: '#FFFFFF', border: '#CBD5E1' },
  { name: 'เทา', hex: '#64748B' },
  { name: 'แดง', hex: '#EF4444' },
  { name: 'น้ำเงิน', hex: '#3B82F6' },
  { name: 'ฟ้า', hex: '#0EA5E9' },
  { name: 'เขียว', hex: '#10B981' },
  { name: 'เหลือง', hex: '#FACC15' },
  { name: 'ส้ม', hex: '#FF7A00' },
  { name: 'ชมพู', hex: '#EC4899' },
  { name: 'ม่วง', hex: '#8B5CF6' },
  { name: 'น้ำตาล', hex: '#78350F' },
  { name: 'ทอง', hex: '#D97706' },
  { name: 'เงิน', hex: '#94A3B8' },
  { name: 'หลากสี/อื่นๆ', hex: '#A855F7' },
];
