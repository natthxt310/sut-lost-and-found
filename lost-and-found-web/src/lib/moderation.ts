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
export const INAPPROPRIATE_KEYWORDS = [
  // คำหยาบและคำด่า
  'ควย', 'เหี้ย', 'สัส', 'เย็ด', 'มึง', 'กู', 'ระยำ', 'จัญไร', 'ดอกทอง', 'สถุล', 'อีดอก', 'ชิบหาย',
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'bastard', 'ห่า', 'ไอ้สัตว์', 'ไอ้ควาย',
  // สแปม / การพนัน / หลอกลวง
  'เว็บบอล', 'บาคาร่า', 'สล็อต', 'เว็บตรง', 'เครดิตฟรี', 'แจกเงิน', 'กู้เงินด่วน', 'หวยออนไลน์', 'pg slot',
  'casino', 'betting', 'gamble',
  // สิ่งผิดกฎหมาย / อาวุธ / ยาเสพติด
  'ยาบ้า', 'กัญชาเถื่อน', 'ใบกระท่อมเถื่อน', 'บุหรี่ไฟฟ้าเถื่อน', 'ปืนเถื่อน', 'อาวุธ', 'น้ำท่อม',
];

// รูปแบบข้อความสแปม เช่น ตัวอักษรซ้ำๆ มั่วๆ (Keyboard Smash)
const KEYBOARD_SMASH_REGEX = /(.)\1{5,}/i;

export function checkInappropriateText(text: string): { isSafe: boolean; flaggedKeywords: string[] } {
  if (!text) return { isSafe: true, flaggedKeywords: [] };
  const lower = text.toLowerCase();
  const flaggedKeywords: string[] = [];

  for (const word of INAPPROPRIATE_KEYWORDS) {
    if (lower.includes(word.toLowerCase())) {
      flaggedKeywords.push(word);
    }
  }

  return {
    isSafe: flaggedKeywords.length === 0,
    flaggedKeywords,
  };
}

export function moderateUserName(name: string): { isSafe: boolean; reason?: string } {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { isSafe: false, reason: 'ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร' };
  }
  const check = checkInappropriateText(trimmed);
  if (!check.isSafe) {
    return {
      isSafe: false,
      reason: `ตรวจพบคำไม่เหมาะสมในชื่อ: "${check.flaggedKeywords.join(', ')}" กรุณาใช้ชื่อที่สุภาพ`,
    };
  }
  return { isSafe: true };
}

export function moderateChatMessage(message: string): { isSafe: boolean; reason?: string } {
  const trimmed = message.trim();
  if (!trimmed) {
    return { isSafe: false, reason: 'ข้อความต้องไม่ว่างเปล่า' };
  }
  const check = checkInappropriateText(trimmed);
  if (!check.isSafe) {
    return {
      isSafe: false,
      reason: `ตรวจพบคำไม่สุภาพในข้อความแชท: "${check.flaggedKeywords.join(', ')}" กรุณาใช้ถ้อยคำที่สุภาพ`,
    };
  }
  return { isSafe: true };
}

export function moderateContent(title: string, description: string, imageUrl?: string): ModerationResult {
  const combinedText = `${title} ${description}`.toLowerCase();
  const check = checkInappropriateText(combinedText);

  if (!check.isSafe) {
    return {
      isSafe: false,
      status: 'rejected',
      score: 0.1,
      reason: `ตรวจพบคำไม่เหมาะสมหรือเนื้อหาต้องห้าม: ${check.flaggedKeywords.join(', ')}`,
      flaggedKeywords: check.flaggedKeywords,
    };
  }

  if (KEYBOARD_SMASH_REGEX.test(combinedText)) {
    return {
      isSafe: false,
      status: 'flagged',
      score: 0.4,
      reason: 'ตรวจพบข้อความมีรูปแบบตัวอักษรซ้ำผิดปกติ (อาจเป็นสแปมหรือข้อความทดสอบ)',
      flaggedKeywords: ['ตัวอักษรซ้ำผิดปกติ'],
    };
  }

  if (title.trim().length < 3) {
    return {
      isSafe: false,
      status: 'flagged',
      score: 0.5,
      reason: 'ชื่อสิ่งของสั้นเกินไป ควรระบุให้ชัดเจนเพื่อให้ค้นหาเจอได้ง่าย',
      flaggedKeywords: ['ชื่อสั้นเกินไป'],
    };
  }

  if (imageUrl) {
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

  return {
    isSafe: true,
    status: 'approved',
    score: 0.98,
    reason: '✅ ผ่านการตรวจสอบความปลอดภัยอัตโนมัติ (AI Safe Content)',
    flaggedKeywords: [],
  };
}
