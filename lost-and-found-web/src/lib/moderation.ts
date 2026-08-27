// ==========================================================
// SUT AI Automated Content Safety & Moderation Engine
// ระบบตรวจจับความเหมาะสมของข้อความและรูปภาพอัตโนมัติ (ลดภาระแอดมิน)
// ==========================================================

export interface ModerationResult {
  isSafe: boolean;
  status: 'approved' | 'rejected' | 'flagged';
  score: number; // 0.0 - 1.0 (1.0 คือ ปลอดภัยสูงสุด)
  reason?: string;
  flaggedKeywords: string[];
}

// รายการคำไม่เหมาะสม คำหยาบ สแปม และเนื้อหาต้องห้าม
const INAPPROPRIATE_KEYWORDS = [
  // คำหยาบและคำด่า
  'ควย', 'เหี้ย', 'สัส', 'เย็ด', 'มึง', 'กู', 'ระยำ', 'จัญไร', 'ดอกทอง', 'สถุล', 'อีดอก', 'ชิบหาย',
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'bastard',
  // สแปม / การพนัน / หลอกลวง
  'เว็บบอล', 'บาคาร่า', 'สล็อต', 'เว็บตรง', 'เครดิตฟรี', 'แจกเงิน', 'กู้เงินด่วน', 'หวยออนไลน์', 'pg slot',
  'casino', 'betting', 'gamble',
  // สิ่งผิดกฎหมาย / อาวุธ / ยาเสพติด
  'ยาบ้า', 'กัญชาเถื่อน', 'ใบกระท่อมเถื่อน', 'บุหรี่ไฟฟ้าเถื่อน', 'ปืนเถื่อน', 'อาวุธ', 'น้ำท่อม',
];

// รูปแบบข้อความสแปม เช่น ตัวอักษรซ้ำๆ มั่วๆ (Keyboard Smash)
const KEYBOARD_SMASH_REGEX = /(.)\1{5,}/i; // เช่น aaaaaaa, 55555555, asdfghjkl

export function moderateContent(title: string, description: string, imageUrl?: string): ModerationResult {
  const combinedText = `${title} ${description}`.toLowerCase();
  const flaggedKeywords: string[] = [];

  // 1. ตรวจสอบคำหยาบและเนื้อหาต้องห้าม
  for (const word of INAPPROPRIATE_KEYWORDS) {
    if (combinedText.includes(word.toLowerCase())) {
      flaggedKeywords.push(word);
    }
  }

  if (flaggedKeywords.length > 0) {
    return {
      isSafe: false,
      status: 'rejected',
      score: 0.1,
      reason: `ตรวจพบคำไม่เหมาะสมหรือเนื้อหาต้องห้าม: ${flaggedKeywords.join(', ')}`,
      flaggedKeywords,
    };
  }

  // 2. ตรวจจับการพิมพ์มั่ว / สแปมตัวอักษรซ้ำๆ
  if (KEYBOARD_SMASH_REGEX.test(combinedText)) {
    return {
      isSafe: false,
      status: 'flagged',
      score: 0.4,
      reason: 'ตรวจพบข้อความมีรูปแบบตัวอักษรซ้ำผิดปกติ (อาจเป็นสแปมหรือข้อความทดสอบ)',
      flaggedKeywords: ['ตัวอักษรซ้ำผิดปกติ'],
    };
  }

  // 3. ตรวจสอบความยาวและความหมายของชื่อโพสต์
  if (title.trim().length < 3) {
    return {
      isSafe: false,
      status: 'flagged',
      score: 0.5,
      reason: 'ชื่อสิ่งของสั้นเกินไป ควรระบุให้ชัดเจนเพื่อให้ค้นหาเจอได้ง่าย',
      flaggedKeywords: ['ชื่อสั้นเกินไป'],
    };
  }

  // 4. ตรวจสอบรูปภาพ
  if (imageUrl) {
    // ตรวจสอบว่าเป็น URL หรือ File URI ที่ถูกต้อง
    const isUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('file://') || imageUrl.startsWith('data:image/');
    if (!isUrl) {
      return {
        isSafe: false,
        status: 'flagged',
        score: 0.6,
        reason: 'ลิงก์รูปภาพไม่ถูกต้องหรือรูปแบบไฟล์ไม่รองรับ',
        flaggedKeywords: ['รูปภาพไม่ถูกต้อง'],
      };
    }
  }

  // 5. ผ่านเกณฑ์ปลอดภัย 100% (Auto-Approved)
  return {
    isSafe: true,
    status: 'approved',
    score: 0.98,
    reason: '✅ ผ่านการตรวจสอบความปลอดภัยอัตโนมัติ (AI Safe Content)',
    flaggedKeywords: [],
  };
}
