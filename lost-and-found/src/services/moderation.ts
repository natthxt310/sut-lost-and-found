// =========================================================================
// 🛡️ ฟีเจอร์: ระบบตรวจจับความปลอดภัยและคัดกรองเนื้อหา (AI Content Moderation)
// =========================================================================
// 💡 อธิบายการทำงานแบบเข้าใจง่าย:
// ทำหน้าที่เหมือน "รปภ. ตรวจข้อความ" ก่อนที่โพสต์จะถูกเผยแพร่ออกสู่สาธารณะ
// 
// 🔍 หน้าที่หลัก 4 อย่าง:
// 1. ตรวจจับคำหยาบ / คำด่า / การพนัน / สิ่งผิดกฎหมาย => ถ้าพบจะ "บล็อกทันที (Rejected)"
// 2. ตรวจจับการพิมพ์มั่วๆ (เช่น 55555555555, aaaaaaa) => ถ้าพบจะ "เตือน (Flagged)"
// 3. ตรวจสอบชื่อสิ่งของ => ต้องยาวอย่างน้อย 3 ตัวอักษร
// 4. ตรวจสอบไฟล์รูปภาพ => ต้องเป็นลิงก์ภาพที่ถูกต้อง
// =========================================================================

export interface ModerationResult {
  isSafe: boolean;                       // ข้อความปลอดภัยหรือไม่ (true/false)
  status: 'approved' | 'rejected' | 'flagged'; // ผ่าน / โดนแบน / แจ้งเตือน
  score: number;                         // คะแนนความปลอดภัย (0.0 - 1.0)
  reason?: string;                       // เหตุผลที่แจ้งเตือน
  flaggedKeywords: string[];             // คำต้องห้ามที่ตรวจพบ
}

// 🚫 รายการคำต้องห้าม (คำหยาบ, การพนัน, สแปม, สิ่งผิดกฎหมาย)
const INAPPROPRIATE_KEYWORDS = [
  // คำหยาบและคำด่าภาษาไทย/อังกฤษ
  'ควย', 'เหี้ย', 'สัส', 'เย็ด', 'มึง', 'กู', 'ระยำ', 'จัญไร', 'ดอกทอง', 'สถุล', 'อีดอก', 'ชิบหาย',
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'bastard',
  
  // สแปม / เว็บพนัน / เงินกู้
  'เว็บบอล', 'บาคาร่า', 'สล็อต', 'เว็บตรง', 'เครดิตฟรี', 'แจกเงิน', 'กู้เงินด่วน', 'หวยออนไลน์', 'pg slot',
  'casino', 'betting', 'gamble',
  
  // สิ่งผิดกฎหมาย / สารเสพติด
  'ยาบ้า', 'กัญชาเถื่อน', 'ใบกระท่อมเถื่อน', 'บุหรี่ไฟฟ้าเถื่อน', 'ปืนเถื่อน', 'อาวุธ', 'น้ำท่อม',
];

// ดักจับการพิมพ์ตัวอักษรซ้ำๆ ติดกันเกิน 5 ตัว (เช่น fffffff หรือ 555555)
const KEYBOARD_SMASH_REGEX = /(.)\1{5,}/i;

export function moderatePostContent(title: string, description: string, imageUrl?: string): ModerationResult {
  const combinedText = `${title} ${description}`.toLowerCase();
  const flaggedKeywords: string[] = [];

  // 1. ตรวจสอบว่ามีคำต้องห้ามอยู่ในข้อความหรือไม่
  for (const word of INAPPROPRIATE_KEYWORDS) {
    if (combinedText.includes(word.toLowerCase())) {
      flaggedKeywords.push(word);
    }
  }

  // ถ้าเจอคำหยาบ => สั่ง Rejected ทันที
  if (flaggedKeywords.length > 0) {
    return {
      isSafe: false,
      status: 'rejected',
      score: 0.1,
      reason: `⚠️ ตรวจพบคำไม่เหมาะสมสำหรับพื้นที่สาธารณะ: "${flaggedKeywords.join(', ')}" กรุณาแก้ไขก่อนเผยแพร่`,
      flaggedKeywords,
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
    const isUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('file://') || imageUrl.startsWith('data:image/');
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
