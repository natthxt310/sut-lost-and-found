import { PostItem, MatchNotification } from '../types';

/**
 * =========================================================================
 * 🎯 ฟีเจอร์: ระบบจับคู่อัตโนมัติบนเซิร์ฟเวอร์ (Server-Side Auto Matching)
 * =========================================================================
 * 💡 การทำงาน:
 * เมื่อมีใครสร้างโพสต์ใหม่ เซิร์ฟเวอร์จะเอาโพสต์นั้นไปเปรียบเทียบกับโพสต์ทั้งหมดที่มี
 * 
 * 📊 เกณฑ์คะแนน (เต็ม 100):
 * - หมวดหมู่ตรงกัน  = +40 คะแนน
 * - สีของสิ่งของตรงกัน = +30 คะแนน (สีคล้าย = +20)
 * - สถานที่ มทส. ตรงกัน = +30 คะแนน
 * 
 * 👉 ถ้าได้คะแนนรวม >= 70% จะสร้างการแจ้งเตือน (Notification) บันทึกลงฐานข้อมูลทันที
 * =========================================================================
 */

export function calculateMatchScore(postA: PostItem, postB: PostItem): number {
  // ต้องเป็นการเทียบระหว่าง "ของหาย" กับ "คนเจอของ"
  if (postA.type === postB.type) return 0;

  let score = 0;
  // 1. หมวดหมู่ตรงกัน
  if (postA.category === postB.category) score += 40;
  
  // 2. สีตรงกัน
  if (postA.color === postB.color) {
    score += 30;
  } else if (postA.color.includes(postB.color) || postB.color.includes(postA.color)) {
    score += 20;
  }
  
  // 3. สถานที่ตรงกัน
  if (postA.location === postB.location) score += 30;

  return score;
}

export function findMatchesForPost(newPost: PostItem, allPosts: PostItem[]): MatchNotification[] {
  const notifications: MatchNotification[] = [];

  for (const existingPost of allPosts) {
    if (existingPost.id === newPost.id) continue;
    if (existingPost.status === 'returned') continue;

    const score = calculateMatchScore(newPost, existingPost);
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
