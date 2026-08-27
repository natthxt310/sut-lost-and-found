import { PostItem, MatchNotification } from '../types';

/**
 * =========================================================================
 * 🎯 ฟีเจอร์: ระบบจับคู่อัตโนมัติ (Auto-Matching Algorithm)
 * =========================================================================
 * 💡 อธิบายการทำงานแบบเข้าใจง่าย:
 * เปรียบเสมือน "ระบบจับคู่สิ่งของ" ระหว่าง "คนที่ทำของหาย" กับ "คนที่เก็บของได้"
 * 
 * 📌 กฎการให้คะแนนความเหมือน (เต็ม 100 คะแนน):
 * 1. หมวดหมู่ตรงกันเป๊ะ (เช่น กุญแจเหมือนกัน)  => ได้ +40 คะแนน
 * 2. สีตรงกันเป๊ะ (เช่น สีดำเหมือนกัน)         => ได้ +30 คะแนน (ถ้าสีใกล้เคียงได้ +20)
 * 3. สถานที่ตรงกันเป๊ะ (เช่น อาคาร B1 เหมือนกัน) => ได้ +30 คะแนน
 * 
 * 🔔 เกณฑ์การแจ้งเตือน:
 * ถ้าคะแนนรวมกันได้ "70 คะแนนขึ้นไป" (เช่น หมวดหมู่ตรง + สีตรง หรือ หมวดหมู่ตรง + สถานที่ตรง)
 * ระบบจะถือว่า "น่าจะเป็นของชิ้นเดียวกัน" และส่งแจ้งเตือนไปหาผู้ใช้ทันที!
 * =========================================================================
 */

export function calculateMatchScore(postA: PostItem, postB: PostItem): number {
  // เงื่อนไขแรก: ต้องเป็นคนละประเภทกัน (ของหาย เทียบกับ ของที่เก็บได้ เท่านั้น)
  if (postA.type === postB.type) return 0;

  let score = 0;

  // 1. ตรวจสอบหมวดหมู่ (น้ำหนัก 40 คะแนน)
  if (postA.category === postB.category) {
    score += 40;
  }

  // 2. ตรวจสอบสีสิ่งของ (น้ำหนัก 30 คะแนน)
  if (postA.color === postB.color) {
    score += 30; // สีตรงกันเป๊ะ
  } else if (
    postA.color.includes(postB.color) ||
    postB.color.includes(postA.color)
  ) {
    score += 20; // สีคล้ายคลึงกัน
  }

  // 3. ตรวจสอบพิกัดสถานที่ใน มทส. (น้ำหนัก 30 คะแนน)
  if (postA.location === postB.location) {
    score += 30;
  }

  return score;
}

/**
 * ฟังก์ชันค้นหาโพสต์ที่มีโอกาสตรงกันทั้งหมด
 * แล้วสร้างเป็นรายการแจ้งเตือน (Match Notifications)
 */
export function findMatchesForPost(
  newPost: PostItem,
  allPosts: PostItem[]
): MatchNotification[] {
  const notifications: MatchNotification[] = [];

  for (const existingPost of allPosts) {
    // ไม่เปรียบเทียบกับตัวเอง
    if (existingPost.id === newPost.id) continue;
    
    // ข้ามของที่ส่งคืนเจ้าของสำเร็จแล้ว
    if (existingPost.status === 'returned') continue;

    // คำนวณคะแนนความเหมือน
    const score = calculateMatchScore(newPost, existingPost);

    // ถ้าคะแนนถึง 70% ให้สร้างแจ้งเตือนส่งให้เจ้าของโพสต์
    if (score >= 70) {
      notifications.push({
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sourcePostId: newPost.id,
        matchedPostId: existingPost.id,
        sourcePostTitle: newPost.title,
        matchedPostTitle: existingPost.title,
        matchScore: score,
        category: existingPost.category,
        color: existingPost.color,
        location: existingPost.location,
        matchedWithUserName: existingPost.userName,
        matchedWithContact: existingPost.userContact,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return notifications;
}
