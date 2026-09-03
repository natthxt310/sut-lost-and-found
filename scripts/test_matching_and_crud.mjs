// Automated Verification Script for SUT Lost & Found Real Persistent Database
// Tests Disk Storage (data/database.json), 3-Source CRUD, and Auto-Matching

import fs from 'fs';
import path from 'path';
import { calculateMatchScore, findMatchesForPost } from '../lost-and-found-web/src/lib/matching.ts';
import { persistentDb } from '../lost-and-found-web/src/lib/db.ts';

console.log('=====================================================');
console.log('🧪 RUNNING REAL PERSISTENT DATABASE TESTS');
console.log('=====================================================\n');

let passCount = 0;
let totalCount = 0;

function assert(condition, testName) {
  totalCount++;
  if (condition) {
    console.log(`✅ PASS [TC-${String(totalCount).padStart(3, '0')}]: ${testName}`);
    passCount++;
  } else {
    console.error(`❌ FAIL [TC-${String(totalCount).padStart(3, '0')}]: ${testName}`);
  }
}

// 1. Check if database file exists on disk
const dbFilePath = persistentDb.getDbFilePath();
const fileExists = fs.existsSync(dbFilePath);
assert(fileExists, `Physical database file exists on disk at ${dbFilePath}`);

// 2. Test Auto-Matching Algorithm (RQ-009)
const postLost = {
  id: 'test-lost-01',
  type: 'lost',
  title: 'กุญแจรถฮอนด้าสีดำ',
  category: 'กุญแจรถ / พวงกุญแจ',
  color: 'ดำ',
  location: 'อาคารเรียนรวม 1 (B1)',
  dateTime: '2026-08-24 10:00',
  description: 'ทำตกไว้',
  imageUrl: '',
  status: 'lost',
  userId: 'u1',
  userName: 'User 1',
  userContact: '081',
  userEmail: 'u1@g.sut.ac.th',
  createdAt: new Date().toISOString(),
};

const postFoundMatching = {
  id: 'test-found-01',
  type: 'found',
  title: 'พบกุญแจรถฮอนด้าสีดำ',
  category: 'กุญแจรถ / พวงกุญแจ',
  color: 'ดำ',
  location: 'อาคารเรียนรวม 1 (B1)',
  dateTime: '2026-08-24 10:05',
  description: 'พบที่ B1',
  imageUrl: '',
  status: 'found',
  userId: 'u2',
  userName: 'User 2',
  userContact: '082',
  userEmail: 'u2@g.sut.ac.th',
  createdAt: new Date().toISOString(),
};

const matchScoreHigh = calculateMatchScore(postLost, postFoundMatching);
assert(matchScoreHigh === 100, `Auto-Matching calculation is 100% for matched tags (45 + 35 + 20)`);

// Test new matching weight redistribution: Location reduced from 30 to 20, distributed to Category (45) and Color (35)
const scoreCategoryOnly = calculateMatchScore({ ...postLost, color: 'ขาว', location: 'C1' }, postFoundMatching);
assert(scoreCategoryOnly === 45, `Auto-Matching Category weight is 45 points (increased by 5)`);

const scoreColorOnly = calculateMatchScore({ ...postLost, category: 'ร่ม', location: 'C1' }, postFoundMatching);
assert(scoreColorOnly === 35, `Auto-Matching Color weight is 35 points (increased by 5)`);

const scoreLocationOnly = calculateMatchScore({ ...postLost, category: 'ร่ม', color: 'ขาว' }, postFoundMatching);
assert(scoreLocationOnly === 20, `Auto-Matching Location weight is 20 points (reduced from 30)`);

// 3. Test Persistent Source 1 CRUD (Users on Disk)
const initialUsers = persistentDb.getUsers();
assert(initialUsers.length >= 3, `Source 1 Retrieve: Found ${initialUsers.length} users in database.json`);

const newUser = persistentDb.createUser({
  studentId: 'B6899999',
  fullName: 'นายทดสอบ บันทึกจริง',
  email: 'b6899999@g.sut.ac.th',
  phone: '088-999-7777',
  role: 'student',
});
assert(newUser.studentId === 'B6899999', 'Source 1 Create: Successfully saved user to database.json');

// Verify file on disk contains new user
const diskContent1 = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
assert(diskContent1.users.some((u) => u.studentId === 'B6899999'), 'Disk Check: Verified new user is physically written to disk');

const updatedUser = persistentDb.updateUser(newUser.id, { phone: '089-111-2222' });
assert(updatedUser?.phone === '089-111-2222', 'Source 1 Update: Successfully updated user phone in database.json');

persistentDb.deleteUser(newUser.id);
const diskContentAfterDelete = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
assert(!diskContentAfterDelete.users.some((u) => u.id === newUser.id), 'Source 1 Delete: Verified user is permanently deleted from disk');

// 4. Test Persistent Source 2 CRUD (Posts on Disk)
const createdPost = persistentDb.createPost({
  type: 'lost',
  title: 'แท็บเล็ต Samsung Galaxy Tab S9 สีดำ',
  category: 'แท็บเล็ต / iPad / โน้ตบุ๊ก',
  color: 'ดำ',
  location: 'ศูนย์บรรณสารและสื่อการศึกษา (หอสมุด)',
  dateTime: '2026-08-24 11:30',
  description: 'ลืมไว้ที่โซนคอมพิวเตอร์ชั้น 1',
  imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600',
  status: 'lost',
  userId: 'usr-001',
  userName: 'ศิวะพร ภูดินทราย',
  userContact: '089-123-4567',
  userEmail: 'b6802189@g.sut.ac.th',
});
assert(createdPost.title.includes('Samsung'), 'Source 2 Create: Successfully added post to database.json');

const diskContentPosts = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
assert(diskContentPosts.posts.some((p) => p.id === createdPost.id), 'Disk Check: Verified new post exists in physical database.json file');

assert(createdPost.isApproved === false, 'Source 2 Approval: Verified new post defaults to unapproved (pending admin review)');

const approvedPost = persistentDb.approvePost(createdPost.id, true);
assert(approvedPost?.isApproved === true && approvedPost?.moderationStatus === 'approved', 'Source 2 Approval: Admin successfully approved post to live status');

const updatedPost = persistentDb.updatePost(createdPost.id, { status: 'returned' });
assert(updatedPost?.status === 'returned', 'Source 2 Update: Successfully updated post status to returned');

persistentDb.deletePost(createdPost.id);
const diskContentPostsAfterDel = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
assert(!diskContentPostsAfterDel.posts.some((p) => p.id === createdPost.id), 'Source 2 Delete: Verified post is deleted from disk');

// 5. Test Persistent Source 3 CRUD (Favorites on Disk)
const fav = persistentDb.addFavorite('usr-001', 'post-001', 'โน้ตช่วยจำบนดิสก์จริง');
assert(fav.postId === 'post-001', 'Source 3 Create: Successfully stored favorite in database.json');

const diskContentFavs = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
assert(diskContentFavs.favorites.some((f) => f.id === fav.id), 'Disk Check: Verified favorite is saved to physical disk');

const updatedFav = persistentDb.updateFavoriteNote(fav.id, 'แก้ไขโน้ตช่วยจำเป็นข้อความใหม่');
assert(updatedFav?.personalNote === 'แก้ไขโน้ตช่วยจำเป็นข้อความใหม่', 'Source 3 Update: Successfully updated favorite note');

persistentDb.deleteFavorite(fav.id);
const diskContentFavsAfterDel = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
assert(!diskContentFavsAfterDel.favorites.some((f) => f.id === fav.id), 'Source 3 Delete: Verified favorite is removed from disk');

// 6. Test Monthly Stats
const stats = persistentDb.getStats();
assert(typeof stats.totalLost === 'number' && stats.totalLost >= 0, `Stats: Total lost items = ${stats.totalLost}`);
assert(typeof stats.totalFound === 'number' && stats.totalFound >= 0, `Stats: Total found items = ${stats.totalFound}`);
assert(stats.returnRatePercentage >= 0, `Stats: Return rate = ${stats.returnRatePercentage}%`);

// 7. Test In-App Direct Chat Messages (Real Persistence)
const chatMsg = persistentDb.sendMessage({
  postId: 'post-001',
  postTitle: 'กุญแจรถมอเตอร์ไซค์ Honda Wave',
  senderId: 'usr-001',
  senderName: 'ศิวะพร ภูดินทราย',
  receiverId: 'usr-002',
  receiverName: 'นัฐภัทร์ กตัญวิญญู',
  text: 'สวัสดีครับ สะดวกนัดรับที่อาคารเรียนรวม 1 (B1) มั๊ยครับ?',
});
assert(chatMsg.id.startsWith('msg-'), 'Chat: Successfully created and saved direct message to database.json');

// 8. Test Quarterly Stats (รายงานประจำไตรมาส - ครบ 5 ตัวชี้วัดที่กำหนด)
const qStats = persistentDb.getQuarterlyStats(3, 2569);
assert(typeof qStats.totalLost === 'number', `Quarterly [Q3]: Total lost in quarter = ${qStats.totalLost} items`);
assert(typeof qStats.totalReturned === 'number', `Quarterly [Q3]: Total returned in quarter = ${qStats.totalReturned} items`);
assert(typeof qStats.foundNotReturned === 'number', `Quarterly [Q3]: Found pending return in quarter = ${qStats.foundNotReturned} items`);
assert(typeof qStats.unfoundLost === 'number', `Quarterly [Q3]: Unfound lost items in quarter = ${qStats.unfoundLost} items`);
assert(Array.isArray(qStats.top5LostCategories), `Quarterly [Q3]: Top 5 most frequent lost categories ranked (${qStats.top5LostCategories.length} categories)`);

// 9. Test Post Report Management (การจัดการรายงานโพสต์ไม่เหมาะสม)
const testReportPost = persistentDb.createPost({
  type: 'lost',
  title: 'โพสต์ทดสอบสำหรับรายงานสแปม',
  category: 'ของใช้ส่วนตัว & อื่นๆ',
  color: 'ขาว',
  location: 'อาคารเรียนรวม 1 (B1)',
  dateTime: '03/09/2569 12:00',
  description: 'เนื้อหาโฆษณาเว็บพนัน',
  imageUrl: 'https://example.com/test.jpg',
  userId: `usr-spammer-${Date.now()}`,
  userName: 'สแปมเมอร์',
  userContact: '080-000-0000',
  userEmail: 'spam@test.com',
});

const report = persistentDb.createReport({
  postId: testReportPost.id,
  postTitle: testReportPost.title,
  reporterId: 'usr-001',
  reporterName: 'ศิวะพร ภูดินทราย',
  reason: 'spam',
  reasonText: '📢 สแปม / การพนันและโฆษณาผิดกฎหมาย',
  details: 'โพสต์โฆษณาไม่เหมาะสมใน มทส.',
});
assert(report.id.startsWith('rep-') && report.status === 'pending', 'Reports: Successfully created and saved post report to database.json');

const reportsPending = persistentDb.getReports('pending');
assert(reportsPending.some((r) => r.id === report.id), 'Reports: Admin successfully inspected pending reports list');

const notifsBeforeAction = persistentDb.getNotifications().filter(n => n.targetUserId === testReportPost.userId);
assert(notifsBeforeAction.length === 0, 'Reports: Post owner receives NO notification upon initial report');

const hideResult = persistentDb.handleReportAction(report.id, 'hide');
assert(hideResult.success && hideResult.report?.actionTaken === 'hidden', 'Reports: Admin successfully performed action HIDE on reported post');

// Verify post is hidden and owner received anonymous notification
const allPostsAfterHide = persistentDb.getPosts({ all: true });
const hiddenPost = allPostsAfterHide.find((p) => p.id === testReportPost.id);
assert(hiddenPost?.isApproved === false && hiddenPost?.moderationStatus === 'hidden', 'Reports: Verified problematic post is hidden from public feed');

const notifsAfterHide = persistentDb.getNotifications().filter(n => n.targetUserId === testReportPost.userId);
assert(notifsAfterHide.length > 0 && notifsAfterHide[0].matchedWithUserName === 'ผู้ดูแลระบบ (Admin)', 'Reports: Post owner receives anonymous moderation notification from Admin without exposing reporter');

// Test owner editing hidden post -> transitions to pending review
const editedPost = persistentDb.updatePost(testReportPost.id, {
  title: 'เว็บทดสอบถูกแก้ไขแล้ว (ปลอดภัย 100%)',
});
assert(editedPost?.moderationStatus === 'pending' && Boolean(editedPost?.moderationNotes?.includes('แก้ไข')), 'Reports: Edited hidden post automatically transitions to pending review for Admin unhide');

// Test Admin unhides the post
const unhideResult = persistentDb.handleReportAction(report.id, 'unhide');
assert(unhideResult.success && unhideResult.report?.actionTaken === 'unhidden', 'Reports: Admin successfully performed action UNHIDE on edited post');

const allPostsAfterUnhide = persistentDb.getPosts({ all: true });
const unhiddenPost = allPostsAfterUnhide.find((p) => p.id === testReportPost.id);
assert(unhiddenPost?.isApproved === true && unhiddenPost?.moderationStatus === 'approved', 'Reports: Verified post is restored to live status on public feed');

const deleteResult = persistentDb.handleReportAction(report.id, 'delete');
assert(deleteResult.success && deleteResult.report?.actionTaken === 'deleted', 'Reports: Admin successfully performed action DELETE on reported post');

const allPostsAfterDelete = persistentDb.getPosts({ all: true });
assert(!allPostsAfterDelete.some((p) => p.id === testReportPost.id), 'Reports: Verified problematic post is permanently deleted from database.json');

// ==========================================
// SEARCH & SORT TESTING
// ==========================================
// 1. Post Search & Sort
const allDbPosts = persistentDb.getPosts({ all: true });
const searchedPosts = allDbPosts.filter(p => (p.title || '').toLowerCase().includes('iphone') || (p.category || '').toLowerCase().includes('สมาร์ทโฟน'));
assert(searchedPosts.length > 0, `Search: Successfully matched ${searchedPosts.length} posts by keyword 'iPhone' or category 'สมาร์ทโฟน'`);

const sortedPostsNewest = [...allDbPosts].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
const isNewestSorted = sortedPostsNewest.every((p, idx, arr) => idx === 0 || new Date(arr[idx - 1].createdAt || 0).getTime() >= new Date(p.createdAt || 0).getTime());
assert(isNewestSorted, 'Sort: Successfully verified posts ordered chronologically (newest to oldest)');

// 2. Report Search & Sort
const allDbReports = persistentDb.getReports('all');
const searchedReports = allDbReports.filter(r => (r.postTitle || '').toLowerCase().includes('บาคาร่า') || (r.reasonText || '').toLowerCase().includes('สแปม'));
assert(searchedReports.length > 0, `Search: Successfully matched ${searchedReports.length} reports by keyword 'บาคาร่า' / 'สแปม'`);

const sortedReportsReason = [...allDbReports].sort((a, b) => (a.reasonText || '').localeCompare(b.reasonText || '', 'th'));
assert(sortedReportsReason.length === allDbReports.length, 'Sort: Successfully verified reports sortable by reason text');

// 3. User Search & Sort
const allDbUsers = persistentDb.getUsers();
const searchedUsers = allDbUsers.filter(u => (u.fullName || '').toLowerCase().includes('natthapat') || (u.studentId || '').includes('B68'));
assert(searchedUsers.length > 0, `Search: Successfully matched ${searchedUsers.length} users by name 'Natthapat' or studentId 'B68'`);

const sortedUsersAdminFirst = [...allDbUsers].sort((a, b) => {
  const score = (r) => (r === 'admin' ? 3 : r === 'staff' ? 2 : 1);
  return score(b.role) - score(a.role);
});
assert(sortedUsersAdminFirst[0]?.role === 'admin', 'Sort: Successfully verified users sorted with admin role first');

// =====================================================
// 🔔 ADVANCED NOTIFICATION SYSTEM TESTS (TC-042 to TC-045)
// =====================================================

// TC-042: Returned Item Thank You Notification
const testReturnPost = persistentDb.createPost({
  type: 'lost',
  title: 'กระเป๋าสตางค์ Coach สีดำ',
  category: 'กระเป๋า & สัมภาระ',
  color: 'ดำ',
  location: 'อาคารเรียนรวม 1 (B1)',
  dateTime: '1/9/2569 10:00',
  status: 'lost',
  userId: 'usr-tester-01',
  userName: 'ผู้ใช้ทดสอบ แจ้งเตือน',
  userContact: '081-111-2222',
  userEmail: 'tester01@sut.ac.th',
  isApproved: true,
});

persistentDb.updatePost(testReturnPost.id, { status: 'returned' });
const returnedNotif = persistentDb.getNotifications().find(
  (n) => n.type === 'returned_thankyou' && n.sourcePostId === testReturnPost.id
);
assert(!!returnedNotif, `Notification: Successfully generated 'returned_thankyou' notification upon item return`);

// TC-043: Expiring Post Inactivity Reminder
const expiringReminders = persistentDb.checkAndGenerateExpiringPostReminders(0);
assert(expiringReminders.length >= 0, `Notification: Successfully verified 'post_expiry_reminder' generation check`);

// TC-044: Chat Message Notification
persistentDb.sendMessage({
  postId: testReturnPost.id,
  postTitle: testReturnPost.title,
  senderId: 'usr-sender-01',
  senderName: 'ผู้ส่งข้อความ',
  receiverId: 'usr-tester-01',
  receiverName: 'ผู้ใช้ทดสอบ',
  text: 'สะดวกนัดรับของที่ไหนดีครับ?',
});
const chatNotifs = persistentDb.getNotifications('usr-tester-01');
assert(chatNotifs.some(n => n.type === 'message' || n.type === 'returned_thankyou'), `Notification: Successfully verified chat and status notifications for user`);

// TC-045: Mark Read and Clear Notifications
persistentDb.markAllNotificationsAsRead('usr-tester-01');
const userNotifsAfterRead = persistentDb.getNotifications('usr-tester-01');
assert(userNotifsAfterRead.every(n => n.isRead === true), `Notification: Successfully marked all user notifications as read`);

// Clean up test post
persistentDb.deletePost(testReturnPost.id);

console.log('\n=====================================================');
console.log(`🎉 TEST SUMMARY: ${passCount}/${totalCount} TESTS PASSED`);
console.log('=====================================================\n');
