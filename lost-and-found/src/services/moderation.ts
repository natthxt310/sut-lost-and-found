// =========================================================================
// 🛡️ ฟีเจอร์: ระบบตรวจจับความปลอดภัยและคัดกรองเนื้อหา (AI Content Moderation)
// =========================================================================
// 💡 อธิบายการทำงานแบบเข้าใจง่าย:
// ทำหน้าที่เหมือน "รปภ. ตรวจข้อความ" เพื่อความปลอดภัยและความสุภาพในระบบ:
// 1. ตรวจจับและแบนคำไม่เหมาะสม / คำหยาบในการตั้งชื่อผู้ใช้งาน (Name Moderation)
// 2. ตรวจจับและแบนคำไม่เหมาะสม / คำหยาบในข้อความแชท (Chat Moderation)
// 3. ตรวจจับและคัดกรองเนื้อหาโพสต์แจ้งของหาย/พบของ (Post Moderation)
// =========================================================================

export interface ModerationResult {
  isSafe: boolean;                       // ข้อความปลอดภัยหรือไม่ (true/false)
  status: 'approved' | 'rejected' | 'flagged'; // ผ่าน / โดนแบน / แจ้งเตือน
  score: number;                         // คะแนนความปลอดภัย (0.0 - 1.0)
  reason?: string;                       // เหตุผลที่แจ้งเตือน
  flaggedKeywords: string[];             // คำต้องห้ามที่ตรวจพบ
}

// 🚫 รายการคำต้องห้าม (คำหยาบ, คำด่า, การพนัน, สแปม, สิ่งผิดกฎหมาย)
export const INAPPROPRIATE_KEYWORDS = [
  // คำหยาบและคำด่าภาษาไทย/อังกฤษ
  'ควย', 'เหี้ย', 'สัส', 'เย็ด', 'มึง', 'กู', 'ระยำ', 'จัญไร', 'ดอกทอง', 'สถุล', 'อีดอก', 'ชิบหาย',
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'bastard', 'ห่า', 'ไอ้สัตว์', 'ไอ้ควาย',
  
  // สแปม / เว็บพนัน / เงินกู้
  'เว็บบอล', 'บาคาร่า', 'สล็อต', 'เว็บตรง', 'เครดิตฟรี', 'แจกเงิน', 'กู้เงินด่วน', 'หวยออนไลน์', 'pg slot',
  'casino', 'betting', 'gamble',
  
  // สิ่งผิดกฎหมาย / สารเสพติด
  'ยาบ้า', 'กัญชาเถื่อน', 'ใบกระท่อมเถื่อน', 'บุหรี่ไฟฟ้าเถื่อน', 'ปืนเถื่อน', 'อาวุธ', 'น้ำท่อม',
];

// ดักจับการพิมพ์ตัวอักษรซ้ำๆ ติดกันเกิน 5 ตัว (เช่น fffffff หรือ 555555)
const KEYBOARD_SMASH_REGEX = /(.)\1{5,}/i;

/**
 * ตรวจสอบว่ามีคำไม่เหมาะสมอยู่ในข้อความหรือไม่
 */
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

/**
 * 👤 ตรวจสอบความเหมาะสมของการตั้งชื่อผู้ใช้งาน (Name Moderation)
 */
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

/**
 * 💬 ตรวจสอบความเหมาะสมของข้อความแชท (Chat Moderation)
 */
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

/**
 * 📝 ตรวจสอบความเหมาะสมของเนื้อหาโพสต์ (Post Moderation)
 */
export function moderatePostContent(title: string, description: string, imageUrl?: string): ModerationResult {
  const combinedText = `${title} ${description}`.toLowerCase();
  const check = checkInappropriateText(combinedText);

  // 1. ถ้าเจอคำหยาบ => สั่ง Rejected ทันที
  if (!check.isSafe) {
    return {
      isSafe: false,
      status: 'rejected',
      score: 0.1,
      reason: `⚠️ ตรวจพบคำไม่เหมาะสมสำหรับพื้นที่สาธารณะ: "${check.flaggedKeywords.join(', ')}" กรุณาแก้ไขก่อนเผยแพร่`,
      flaggedKeywords: check.flaggedKeywords,
    };
  }

  // 2. ตรวจจับข้อความมั่ว หรือสแปม (ตัวอักษรซ้ำๆ)
  if (KEYBOARD_SMASH_REGEX.test(combinedText)) {
    return {
      isSafe: false,
      status: 'flagged',
      score: 0.4,
      reason: '⚠️ ตรวจพบข้อความมีรูปแบบตัวอักษรซ้ำผิดปกติ กรุณาใช้คำอธิบายที่ชัดเจน',
      flaggedKeywords: ['ตัวอักษรซ้ำผิดปกติ'],
    };
  }

  // 3. ตรวจสอบความยาวของชื่อสิ่งของ (ต้องไม่สั้นเกินไป)
  if (title.trim().length < 3) {
    return {
      isSafe: false,
      status: 'flagged',
      score: 0.5,
      reason: '⚠️ ชื่อสิ่งของสั้นเกินไป กรุณาระบุชื่อสิ่งของให้ชัดเจน (อย่างน้อย 3 ตัวอักษร)',
      flaggedKeywords: ['ชื่อสั้นเกินไป'],
    };
  }

  // 4. ตรวจสอบความถูกต้องของ URL รูปภาพ
  if (imageUrl) {
    const isUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('file://') || imageUrl.startsWith('data:image/') || imageUrl.startsWith('/uploads/');
    if (!isUrl) {
      return {
        isSafe: false,
        status: 'flagged',
        score: 0.6,
        reason: '⚠️ ไฟล์รูปภาพไม่ถูกต้องหรือไม่รองรับ',
        flaggedKeywords: ['รูปภาพไม่ถูกต้อง'],
      };
    }
  }

  // ผ่านทุกเงื่อนไข => ปลอดภัย อนุมัติให้โพสต์ได้เลย
  return {
    isSafe: true,
    status: 'approved',
    score: 0.98,
    reason: '✅ เนื้อหาปลอดภัย พร้อมเผยแพร่สู่สาธารณะ',
    flaggedKeywords: [],
  };
}
