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
assert(matchScoreHigh === 100, `Auto-Matching calculation is 100% for matched tags`);

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
assert(stats.totalLost > 0, `Stats: Total lost items = ${stats.totalLost}`);
assert(stats.totalFound > 0, `Stats: Total found items = ${stats.totalFound}`);
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

const messagesForPost = persistentDb.getMessages('post-001');
assert(messagesForPost.some((m) => m.id === chatMsg.id), 'Chat: Verified direct message retrieved by postId');

console.log('\n=====================================================');
console.log(`🎉 TEST SUMMARY: ${passCount}/${totalCount} TESTS PASSED`);
console.log('=====================================================\n');
