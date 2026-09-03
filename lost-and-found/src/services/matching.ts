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
 * ระบบจะถือว่า "น่าจะเป็นของชิ้นเดียวกัน" และส่งแจ้งเตือนไปหา "คนที่ทำของหาย" ทันที!
 * =========================================================================
 */

export function calculateMatchScore(postA: PostItem, postB: PostItem): number {
  // เงื่อนไขแรก: ต้องเป็นคนละประเภทกัน (ของหาย เทียบกับ ของที่เก็บได้ เท่านั้น)
  if (postA.type === postB.type) return 0;

  let score = 0;

  // 1. ตรวจสอบหมวดหมู่ (น้ำหนัก 45 คะแนน - ปรับเพิ่ม 5 จากการเฉลี่ยส่วนลดสถานที่)
  if (postA.category === postB.category) {
    score += 45;
  }

  // 2. ตรวจสอบสีสิ่งของ (น้ำหนัก 35 คะแนน - ปรับเพิ่ม 5 จากการเฉลี่ยส่วนลดสถานที่)
  if (postA.color === postB.color) {
    score += 35; // สีตรงกันเป๊ะ
  } else if (
    postA.color.includes(postB.color) ||
    postB.color.includes(postA.color)
  ) {
    score += 25; // สีคล้ายคลึงกัน
  }

  // 3. ตรวจสอบพิกัดสถานที่ใน มทส. (น้ำหนัก 20 คะแนน - ลดจาก 30 เหลือ 20 ตามที่ผู้ใช้กำหนด)
  if (postA.location === postB.location) {
    score += 20;
  }

  return score;
}

/**
 * ฟังก์ชันค้นหาโพสต์ที่มีโอกาสตรงกันทั้งหมด
 * แล้วสร้างเป็นรายการแจ้งเตือน (Match Notifications) ส่งให้ผู้ใช้ที่เกี่ยวข้อง
 */
export function findMatchesForPost(
  newPost: PostItem,
  allPosts: PostItem[]
): MatchNotification[] {
  // 🛡️ โพสต์ต้นทางต้องได้รับการอนุมัติแล้วเท่านั้น (isApproved !== false) ถึงจะทำการจับคู่ได้
  if (newPost.isApproved === false || newPost.moderationStatus === 'rejected' || newPost.moderationStatus === 'hidden') {
    return [];
  }

  const notifications: MatchNotification[] = [];

  for (const existingPost of allPosts) {
    // ไม่เปรียบเทียบกับตัวเอง
    if (existingPost.id === newPost.id) continue;
    
    // ข้ามของที่ส่งคืนเจ้าของสำเร็จแล้ว
    if (existingPost.status === 'returned') continue;

    // 🛡️ ข้ามโพสต์ที่ยังไม่ผ่านการอนุมัติ ถูกปฏิเสธ หรือถูกซ่อน
    if (existingPost.isApproved === false || existingPost.moderationStatus === 'rejected' || existingPost.moderationStatus === 'hidden') {
      continue;
    }

    // คำนวณคะแนนความเหมือน
    const score = calculateMatchScore(newPost, existingPost);

    // ถ้าคะแนนถึง 70% ให้สร้างแจ้งเตือนส่งให้เจ้าของโพสต์ที่ตามหาของหาย และคนที่พบของ
    if (score >= 70) {
      const lostPost = newPost.type === 'lost' ? newPost : existingPost;
      const foundPost = newPost.type === 'found' ? newPost : existingPost;

      // 🔔 แจ้งเตือนหลัก: ส่งหา "คนที่ทำของหาย" (ให้รู้ว่ามีคนพบของแล้ว!)
      notifications.push({
        id: `notif-lost-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        targetUserId: lostPost.userId,
        targetUserEmail: lostPost.userEmail,
        type: 'found', // มีคนพบของที่คุณแจ้งหาย
        sourcePostId: lostPost.id, // โพสต์ของหายของตัวเอง
        matchedPostId: foundPost.id, // โพสต์ที่คนอื่นแจ้งพบ
        sourcePostTitle: lostPost.title,
        matchedPostTitle: foundPost.title,
        matchScore: score,
        category: foundPost.category,
        color: foundPost.color,
        location: foundPost.location,
        matchedWithUserName: foundPost.userName,
        matchedWithContact: foundPost.userContact,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // 🔔 แจ้งเตือนรอง: ส่งหา "คนที่พบของ" (ให้รู้ว่ามีคนกำลังตามหาของชิ้นนี้อยู่)
      notifications.push({
        id: `notif-found-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        targetUserId: foundPost.userId,
        targetUserEmail: foundPost.userEmail,
        type: 'match',
        sourcePostId: foundPost.id,
        matchedPostId: lostPost.id,
        sourcePostTitle: foundPost.title,
        matchedPostTitle: lostPost.title,
        matchScore: score,
        category: lostPost.category,
        color: lostPost.color,
        location: lostPost.location,
        matchedWithUserName: lostPost.userName,
        matchedWithContact: lostPost.userContact,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return notifications;
}
