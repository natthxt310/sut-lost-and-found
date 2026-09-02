import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve('lost-and-found-web/data/database.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

if (!db.reports) db.reports = [];

const spamPost = {
  id: 'post-spam-01',
  type: 'lost',
  title: 'รับปั่นบาคาร่า รายได้วันละ 3,000 ทักไลน์ @bkk888',
  category: 'ของใช้ส่วนตัว & อื่นๆ',
  color: 'แดง',
  location: 'อาคารกิจกรรมนักศึกษา (SAC)',
  dateTime: '2/9/2569 22:15',
  imageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
  status: 'lost',
  userId: 'usr-spam-bot',
  userName: 'นายหน้า บาคาร่า',
  userContact: 'Line: @bkk888',
  userEmail: 'spambot@fake.com',
  isApproved: true,
  moderationStatus: 'flagged',
  isReported: true,
  reportCount: 3,
  reportReason: '📢 สแปม / การพนันและโฆษณาผิดกฎหมาย',
  createdAt: '2026-09-02T15:15:00.000Z',
};

const scamPost = {
  id: 'post-scam-02',
  type: 'found',
  title: 'พบ iPhone 15 Pro Max สีไทเทเนียม (โอนค่ามัดจำส่งมอบ 500 บาท)',
  category: 'สมาร์ทโฟน & แท็บเล็ต',
  color: 'เทา',
  location: 'เทคโนธานี',
  dateTime: '2/9/2569 23:05',
  imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
  status: 'found',
  userId: 'usr-scammer',
  userName: 'ผู้ไม่ประสงค์ออกนาม',
  userContact: '080-999-8888',
  userEmail: 'scam@fake.com',
  isApproved: true,
  moderationStatus: 'flagged',
  isReported: true,
  reportCount: 2,
  reportReason: '⚠️ หลอกลวง / มิจฉาชีพเรียกเก็บเงิน',
  createdAt: '2026-09-02T16:05:00.000Z',
};

const reports = [
  {
    id: 'rep-001',
    postId: 'post-spam-01',
    postTitle: 'รับปั่นบาคาร่า รายได้วันละ 3,000 ทักไลน์ @bkk888',
    postImageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    postCategory: 'ของใช้ส่วนตัว & อื่นๆ',
    postAuthorName: 'นายหน้า บาคาร่า',
    reporterId: 'usr-1788359333623-174',
    reporterName: 'Siwaphon (นักศึกษา มทส.)',
    reason: 'spam',
    reasonText: '📢 สแปม / การพนันและโฆษณาผิดกฎหมาย',
    details: 'โพสต์ชวนเล่นการพนันและโปรโมทเว็บ ไม่เกี่ยวข้องกับของหายใน มทส. เลย รบกวนแอดมินลบหรือซ่อนด้วยครับ',
    status: 'pending',
    createdAt: '2026-09-02T16:30:00.000Z',
  },
  {
    id: 'rep-002',
    postId: 'post-scam-02',
    postTitle: 'พบ iPhone 15 Pro Max สีไทเทเนียม (โอนค่ามัดจำส่งมอบ 500 บาท)',
    postImageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
    postCategory: 'สมาร์ทโฟน & แท็บเล็ต',
    postAuthorName: 'ผู้ไม่ประสงค์ออกนาม',
    reporterId: 'usr-1788359329630-68',
    reporterName: 'Natthapat (นักศึกษา มทส.)',
    reason: 'scam',
    reasonText: '⚠️ หลอกลวง / มิจฉาชีพเรียกเก็บเงิน',
    details: 'มีพฤติกรรมเข้าข่ายมิจฉาชีพชัดเจน บังคับให้ผู้เสียหายโอนเงินมัดจำค่าส่งมอบ 500 บาทก่อนถึงจะนัดคืนของ',
    status: 'pending',
    createdAt: '2026-09-02T16:45:00.000Z',
  },
];

// Cleanly add posts
db.posts = db.posts.filter((p) => p.id !== spamPost.id && p.id !== scamPost.id);
db.posts.unshift(scamPost);
db.posts.unshift(spamPost);

// Cleanly add reports
db.reports = (db.reports || []).filter((r) => r.id !== 'rep-001' && r.id !== 'rep-002' && !r.id.startsWith('rep-1788'));
db.reports.unshift(reports[1]);
db.reports.unshift(reports[0]);

db.lastUpdated = new Date().toISOString();
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
console.log('✅ Seeded 2 reported posts and reports successfully!');
