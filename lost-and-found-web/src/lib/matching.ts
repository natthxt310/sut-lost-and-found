import { PostItem, MatchNotification } from '../types';

/**
 * =========================================================================
 * 🎯 ฟีเจอร์: ระบบจับคู่อัตโนมัติบนเซิร์ฟเวอร์ (Server-Side Auto Matching)
 * =========================================================================
 */

export function calculateMatchScore(postA: PostItem, postB: PostItem): number {
  if (postA.type === postB.type) return 0;

  let score = 0;
  // 1. หมวดหมู่: 45 คะแนน (เพิ่มจาก 40 ขึ้นมา 5 จากการเฉลี่ยส่วนลดสถานที่)
  if (postA.category === postB.category) score += 45;
  
  // 2. สีสิ่งของ: 35 คะแนน (เพิ่มจาก 30 ขึ้นมา 5 จากการเฉลี่ยส่วนลดสถานที่)
  if (postA.color === postB.color) {
    score += 35;
  } else if (postA.color.includes(postB.color) || postB.color.includes(postA.color)) {
    score += 25;
  }
  
  // 3. สถานที่: 20 คะแนน (ลดจาก 30 เหลือ 20 ตามที่ผู้ใช้กำหนด)
  if (postA.location === postB.location) score += 20;

  return score;
}

export function findMatchesForPost(newPost: PostItem, allPosts: PostItem[]): MatchNotification[] {
  const notifications: MatchNotification[] = [];

  for (const existingPost of allPosts) {
    if (existingPost.id === newPost.id) continue;
    if (existingPost.status === 'returned') continue;

    const score = calculateMatchScore(newPost, existingPost);
    if (score >= 70) {
      const lostPost = newPost.type === 'lost' ? newPost : existingPost;
      const foundPost = newPost.type === 'found' ? newPost : existingPost;

      // 1. ส่งแจ้งเตือนหาคนที่ทำของหาย (Lost Item Owner)
      notifications.push({
        id: `notif-lost-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        targetUserId: lostPost.userId,
        targetUserEmail: lostPost.userEmail,
        type: 'found',
        sourcePostId: lostPost.id,
        matchedPostId: foundPost.id,
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

      // 2. ส่งแจ้งเตือนหาคนที่พบของ (Found Item Owner)
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
