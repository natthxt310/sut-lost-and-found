import fs from 'fs';
import path from 'path';
import { PostItem, User, FavoriteItem, MatchNotification, ChatMessage, MonthlyStats, QuarterlyStats, TopCategoryStat, PostReport } from '../types';
import { findMatchesForPost } from './matching';

interface DatabaseSchema {
  users: User[];
  posts: PostItem[];
  favorites: FavoriteItem[];
  notifications: MatchNotification[];
  messages?: ChatMessage[];
  reports?: PostReport[];
  lastUpdated: string;
}

const SEED_USERS: User[] = [
  {
    id: 'usr-001',
    studentId: 'B6802189',
    fullName: 'ศิวะพร ภูดินทราย',
    email: 'b6802189@g.sut.ac.th',
    phone: '089-123-4567',
    role: 'student',
    createdAt: '2026-08-01T08:00:00.000Z',
  },
  {
    id: 'usr-002',
    studentId: 'B6803100',
    fullName: 'นัฐภัทร์ กตัญวิญญู',
    email: 'b6803100@g.sut.ac.th',
    phone: '081-999-8888',
    role: 'student',
    createdAt: '2026-08-02T08:00:00.000Z',
  },
  {
    id: 'usr-admin',
    studentId: 'ADMIN-01',
    fullName: 'ผู้ดูแลระบบ สหกรณ์/รปภ. มทส.',
    email: 'admin_lostfound@sut.ac.th',
    phone: '044-225-789',
    role: 'admin',
    createdAt: '2026-07-01T08:00:00.000Z',
  },
];

const SEED_POSTS: PostItem[] = [
  {
    id: 'post-001',
    type: 'lost',
    title: 'กุญแจรถมอเตอร์ไซค์ Honda Wave พร้อมพวงกุญแจตุ๊กตาหมีสีน้ำตาล',
    category: 'กุญแจรถ / พวงกุญแจ',
    color: 'ดำ',
    location: 'อาคารเรียนรวม 1 (B1)',
    dateTime: '2026-08-23 09:30',
    description: 'ทำตกไว้แถวบันไดหน้าห้อง B1125 มีกุญแจบ้านพ่วงอยู่ 2 ดอก ใครพบเห็นรบกวนติดต่อด่วนครับ มีความจำเป็นต้องใช้รถกลับหอ',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80',
    status: 'lost',
    userId: 'usr-001',
    userName: 'ศิวะพร ภูดินทราย',
    userContact: 'Line: siwaporn_sut / 089-123-4567',
    userEmail: 'b6802189@g.sut.ac.th',
    securityQuestion: 'ตุ๊กตาหมีที่ห้อยอยู่ใส่เสื้อสีอะไร?',
    isApproved: true,
    createdAt: '2026-08-23T09:45:00.000Z',
  },
  {
    id: 'post-002',
    type: 'found',
    title: 'พวงกุญแจรถฮอนด้า ตกอยู่ใต้โต๊ะม้าหินอ่อน B1',
    category: 'กุญแจรถ / พวงกุญแจ',
    color: 'ดำ',
    location: 'อาคารเรียนรวม 1 (B1)',
    dateTime: '2026-08-23 10:15',
    description: 'พบพวงกุญแจรถสีดำ มีกุญแจ 3 ดอก ฝากไว้ที่ป้อมยามหน้าอาคารเรียนรวม 1 แล้วนะครับ',
    imageUrl: 'https://images.unsplash.com/photo-1616763355603-9755a640a287?w=600&auto=format&fit=crop&q=80',
    status: 'found',
    userId: 'usr-002',
    userName: 'นัฐภัทร์ กตัญวิญญู',
    userContact: '081-999-8888',
    userEmail: 'b6803100@g.sut.ac.th',
    isApproved: true,
    createdAt: '2026-08-23T10:20:00.000Z',
  },
  {
    id: 'post-003',
    type: 'lost',
    title: 'บัตรนักศึกษา มทส. นายภัทรเวท กุลปัทมานนท์',
    category: 'เอกสาร / บัตรนักศึกษา / กระเป๋าสตางค์',
    color: 'ส้ม (สีแสด มทส.)',
    location: 'โรงอาหารสุรนิเวศน์ (กาสะลอง)',
    dateTime: '2026-08-22 12:40',
    description: 'ลืมไว้ตอนซื้อข้าวแถวร้านข้าวมันไก่ โรงอาหารกาสะลอง รหัส B6802240',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    status: 'found',
    userId: 'usr-003',
    userName: 'ภัทรเวท กุลปัทมานนท์',
    userContact: 'Line: pattaravet_k',
    userEmail: 'b6802240@g.sut.ac.th',
    isApproved: true,
    createdAt: '2026-08-22T13:00:00.000Z',
  },
  {
    id: 'post-004',
    type: 'found',
    title: 'หูฟัง AirPods Pro เคสสีเขียวเหนี่ยวทรัพย์',
    category: 'หูฟัง / AirPods / Gadgets',
    color: 'เขียว',
    location: 'ศูนย์บรรณสารและสื่อการศึกษา (หอสมุด)',
    dateTime: '2026-08-22 16:30',
    description: 'พบที่โต๊ะอ่านหนังสือชั้น 2 โซนเงียบ ข้างในมีหูฟังครบ 2 ข้าง นำมาติดต่อขอรับได้โดยบอกชื่อ Bluetooth',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80',
    status: 'found',
    userId: 'usr-004',
    userName: 'รพีพรรณ ช่วงชิง',
    userContact: 'Line: rapeepan_cc',
    userEmail: 'b6802196@g.sut.ac.th',
    securityQuestion: 'ชื่อ Bluetooth ของหูฟังชื่ออะไร?',
    isApproved: true,
    createdAt: '2026-08-22T17:00:00.000Z',
  },
  {
    id: 'post-005',
    type: 'lost',
    title: 'iPad Air 5 สี Space Gray ใส่เคสสีม่วงพาสเทล',
    category: 'แท็บเล็ต / iPad / โน้ตบุ๊ก',
    color: 'ม่วง',
    location: 'อาคารเรียนรวม 2 (B2)',
    dateTime: '2026-08-21 15:00',
    description: 'ลืมไว้ห้องเรียนรวม B2101 หลังเลิกวิชาแคลคูลัส มีปากกา Apple Pencil แปะอยู่ข้างเครื่อง',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
    status: 'returned',
    userId: 'usr-005',
    userName: 'รามเทพ ตรีเมฆ',
    userContact: '085-555-4321',
    userEmail: 'b6804145@g.sut.ac.th',
    isApproved: true,
    createdAt: '2026-08-21T15:30:00.000Z',
  },
];

const SEED_FAVORITES: FavoriteItem[] = [
  {
    id: 'fav-001',
    userId: 'usr-001',
    postId: 'post-004',
    personalNote: 'หูฟังเหมือนของเพื่อนในสาขา รอถามเพื่อนก่อน',
    createdAt: '2026-08-22T18:00:00.000Z',
  },
];

const SEED_NOTIFICATIONS: MatchNotification[] = [
  {
    id: 'notif-001',
    sourcePostId: 'post-001',
    matchedPostId: 'post-002',
    sourcePostTitle: 'กุญแจรถมอเตอร์ไซค์ Honda Wave',
    matchedPostTitle: 'พวงกุญแจรถฮอนด้า ตกอยู่ใต้โต๊ะม้าหินอ่อน B1',
    matchScore: 95,
    category: 'กุญแจรถ / พวงกุญแจ',
    color: 'ดำ',
    location: 'อาคารเรียนรวม 1 (B1)',
    matchedWithUserName: 'นัฐภัทร์ กตัญวิญญู',
    matchedWithContact: '081-999-8888',
    isRead: false,
    createdAt: '2026-08-23T10:21:00.000Z',
  },
];

export class PersistentDatabase {
  private dbFilePath: string;

  constructor(customPath?: string) {
    if (customPath) {
      this.dbFilePath = customPath;
    } else {
      // ตรวจหาโฟลเดอร์ data ไม่ว่าจะรันจาก root workspace หรือ lost-and-found-web
      let dataDir = path.resolve(process.cwd(), 'data');
      if (fs.existsSync(path.resolve(process.cwd(), 'lost-and-found-web'))) {
        dataDir = path.resolve(process.cwd(), 'lost-and-found-web', 'data');
      }
      if (!fs.existsSync(dataDir)) {
        try {
          fs.mkdirSync(dataDir, { recursive: true });
        } catch (e) {
          // ignore
        }
      }
      this.dbFilePath = path.join(dataDir, 'database.json');
    }
    this.ensureInitialized();
  }

  public getDbFilePath(): string {
    return this.dbFilePath;
  }

  private ensureInitialized() {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (!fs.existsSync(this.dbFilePath)) {
        const initialData: DatabaseSchema = {
          users: SEED_USERS,
          posts: SEED_POSTS,
          favorites: SEED_FAVORITES,
          notifications: SEED_NOTIFICATIONS,
          lastUpdated: new Date().toISOString(),
        };
        fs.writeFileSync(this.dbFilePath, JSON.stringify(initialData, null, 2), 'utf-8');
      }
    } catch (error) {
      console.error('Error initializing persistent database:', error);
    }
  }

  private readDb(): DatabaseSchema {
    try {
      this.ensureInitialized();
      const content = fs.readFileSync(this.dbFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error reading persistent database, falling back to defaults:', error);
      return {
        users: SEED_USERS,
        posts: SEED_POSTS,
        favorites: SEED_FAVORITES,
        notifications: SEED_NOTIFICATIONS,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  private writeDb(data: DatabaseSchema): void {
    try {
      data.lastUpdated = new Date().toISOString();
      // Atomic write using temporary file to prevent corruption
      const tempPath = `${this.dbFilePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.dbFilePath);
    } catch (error) {
      console.error('Error writing to persistent database:', error);
      fs.writeFileSync(this.dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  }

  // ==========================================
  // SOURCE 1: USERS CRUD (REAL PERSISTENCE)
  // ==========================================
  getUsers(): User[] {
    const db = this.readDb();
    return db.users;
  }

  getUserById(id: string): User | undefined {
    const db = this.readDb();
    return db.users.find((u) => u.id === id);
  }

  getUserByStudentId(studentId: string): User | undefined {
    const db = this.readDb();
    return db.users.find((u) => u.studentId.toUpperCase() === studentId.toUpperCase());
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const db = this.readDb();
    const newUser: User = {
      ...user,
      password: user.password || '123456',
      email: user.email || `${user.studentId.toLowerCase()}@g.sut.ac.th`,
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    this.writeDb(db);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const db = this.readDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    db.users[idx] = { ...db.users[idx], ...updates };
    this.writeDb(db);
    return db.users[idx];
  }

  deleteUser(id: string): boolean {
    const db = this.readDb();
    const initLen = db.users.length;
    db.users = db.users.filter((u) => u.id !== id);
    if (db.users.length < initLen) {
      this.writeDb(db);
      return true;
    }
    return false;
  }

  // ==========================================
  // SOURCE 2: POSTS CRUD (REAL PERSISTENCE)
  // ==========================================
  getPosts(filter?: {
    type?: 'lost' | 'found';
    category?: string;
    location?: string;
    search?: string;
    all?: boolean;
    userId?: string;
  }): PostItem[] {
    const db = this.readDb();
    let result = [...db.posts];

    // การคัดกรองการอนุมัติ (Approval Filter):
    // หาก all เป็น true (Admin Mode) -> ดึงทั้งหมดรวมถึงที่รออนุมัติ
    // หากเป็นผู้ใช้ทั่วไป -> แสดงเฉพาะโพสต์ที่ผ่านการอนุมัติแล้ว (isApproved: true) หรือโพสต์ของตัวเองเท่านั้น
    if (!filter?.all) {
      result = result.filter(
        (p) => p.isApproved === true || (filter?.userId && p.userId === filter.userId)
      );
    }

    if (filter?.type) {
      result = result.filter((p) => p.type === filter.type);
    }
    if (filter?.category && filter.category !== 'ทั้งหมด') {
      result = result.filter((p) => p.category === filter.category);
    }
    if (filter?.location && filter.location !== 'ทั้งหมด') {
      result = result.filter((p) => p.location === filter.location);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.color.toLowerCase().includes(q)
      );
    }
    return result;
  }

  getPostById(id: string): PostItem | undefined {
    const db = this.readDb();
    return db.posts.find((p) => p.id === id);
  }

  createPost(post: Omit<PostItem, 'id' | 'createdAt'>): PostItem {
    const db = this.readDb();
    // โพสต์ใหม่ต้องรอการตรวจสอบและอนุมัติจาก Admin ก่อน เว้นแต่ระบุเป็น approved มาแล้ว
    const isApproved = post.isApproved === true ? true : false;
    const newPost: PostItem = {
      ...post,
      id: `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      isApproved,
      moderationStatus: isApproved ? 'approved' : 'pending',
      moderationNotes: isApproved
        ? '✅ ได้รับการอนุมัติแล้ว (Approved)'
        : '⏳ รอผู้ดูแลระบบ (Admin) ตรวจสอบและอนุมัติก่อนเผยแพร่สู่สาธารณะ',
      createdAt: new Date().toISOString(),
    };
    db.posts.unshift(newPost);
    this.writeDb(db);
    return newPost;
  }

  approvePost(id: string, isApproved: boolean = true): PostItem | undefined {
    const updated = this.updatePost(id, {
      isApproved,
      moderationStatus: isApproved ? 'approved' : 'rejected',
      moderationNotes: isApproved
        ? '✅ ผ่านการตรวจสอบและอนุมัติโดยผู้ดูแลระบบ (Admin Approved)'
        : '❌ ไม่อนุมัติการเผยแพร่โดยผู้ดูแลระบบ (Rejected)',
    });

    if (updated) {
      const nowMs = Date.now();
      const notif: MatchNotification = {
        id: `notif-mod-${nowMs}-${Math.floor(Math.random() * 1000)}`,
        targetUserId: updated.userId,
        targetUserEmail: updated.userEmail,
        type: isApproved ? ('approval_approved' as any) : ('approval_rejected' as any),
        sourcePostId: updated.id,
        matchedPostId: updated.id,
        sourcePostTitle: updated.title,
        matchedPostTitle: isApproved ? 'ผ่านการอนุมัติแล้ว ✅' : 'ถูกปฏิเสธโดยแอดมิน ❌',
        matchScore: 100,
        category: updated.category,
        color: updated.color,
        location: updated.location,
        matchedWithUserName: 'ผู้ดูแลระบบ (Admin)',
        matchedWithContact: isApproved
          ? 'โพสต์ของคุณแสดงบนฟีดสาธารณะเรียบร้อยแล้ว'
          : updated.moderationNotes || '❌ ไม่อนุมัติการเผยแพร่',
        isRead: false,
        createdAt: new Date(nowMs).toISOString(),
      };
      const db = this.readDb();

      // 🔔 บันทึกแจ้งเตือนผลอนุมัติ (เกิดก่อน)
      db.notifications.unshift(notif);

      // ✨ คำนวณและแจ้งเตือนการจับคู่ (Auto-Matching) เกิดขึ้นหลังจากโพสต์ได้รับการอนุมัติแล้ว
      if (isApproved) {
        const approvedPosts = db.posts.filter(
          (p) =>
            p.id !== updated.id &&
            p.isApproved &&
            p.moderationStatus !== 'rejected' &&
            p.moderationStatus !== 'hidden'
        );
        const matches = findMatchesForPost(updated, approvedPosts);
        if (matches.length > 0) {
          // กำหนดเวลา matching ให้อยู่หลังจากเวลาอนุมัติอย่างชัดเจน (nowMs + 2000ms)
          matches.forEach((m, idx) => {
            m.createdAt = new Date(nowMs + 2000 + idx * 100).toISOString();
          });
          // วางไว้ด้านบนสุดเพื่อให้เรียงตามลำดับเวลา: โพสต์อนุมัติก่อน (เกิดก่อน) -> แล้วระบบจึงค้นหาของที่ตรงกัน (เกิดตามมา)
          db.notifications.unshift(...matches);
        }
      }

      this.writeDb(db);
    }

    return updated;
  }

  updatePost(id: string, updates: Partial<PostItem>): PostItem | undefined {
    const db = this.readDb();
    const idx = db.posts.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;

    const prevStatus = db.posts[idx].status;
    db.posts[idx] = {
      ...db.posts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // 🎁 ถ้าเปลี่ยนสถานะเป็น 'returned' (ส่งคืนสำเร็จ) ให้ส่ง Notification ขอบคุณไปยังเจ้าของโพสต์ทันที
    if (updates.status === 'returned' && prevStatus !== 'returned') {
      const p = db.posts[idx];
      const notif: MatchNotification = {
        id: `notif-ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        targetUserId: p.userId,
        targetUserEmail: p.userEmail,
        type: 'returned_thankyou',
        sourcePostId: p.id,
        matchedPostId: p.id,
        sourcePostTitle: p.title,
        matchedPostTitle: 'ส่งคืนสำเร็จแล้ว! ขอบคุณคนดี มทส. 🎁✨',
        matchScore: 100,
        category: p.category,
        color: p.color,
        location: p.location,
        matchedWithUserName: 'ระบบ SUT Lost & Found',
        matchedWithContact: 'ขอบคุณที่ร่วมเป็นส่วนหนึ่งในการช่วยเหลือเพื่อนนักศึกษาและสังคม มทส.',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift(notif);
    }

    this.writeDb(db);
    return db.posts[idx];
  }

  deletePost(id: string): boolean {
    const db = this.readDb();
    const initLen = db.posts.length;
    db.posts = db.posts.filter((p) => p.id !== id);
    db.favorites = db.favorites.filter((f) => f.postId !== id);
    db.notifications = db.notifications.filter(
      (n) => n.sourcePostId !== id && n.matchedPostId !== id
    );
    if (db.posts.length < initLen) {
      this.writeDb(db);
      return true;
    }
    return false;
  }

  // ==========================================
  // SOURCE 3: FAVORITES CRUD (REAL PERSISTENCE)
  // ==========================================
  getFavorites(userId?: string): FavoriteItem[] {
    const db = this.readDb();
    let result = [...db.favorites];
    if (userId) {
      result = result.filter((f) => f.userId === userId);
    }
    return result.map((f) => ({
      ...f,
      post: db.posts.find((p) => p.id === f.postId),
    }));
  }

  addFavorite(userId: string, postId: string, personalNote?: string): FavoriteItem {
    const db = this.readDb();
    const existing = db.favorites.find((f) => f.userId === userId && f.postId === postId);
    if (existing) {
      return {
        ...existing,
        post: db.posts.find((p) => p.id === existing.postId),
      };
    }

    const newFav: FavoriteItem = {
      id: `fav-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      postId,
      personalNote,
      createdAt: new Date().toISOString(),
    };
    db.favorites.unshift(newFav);
    this.writeDb(db);

    return {
      ...newFav,
      post: db.posts.find((p) => p.id === postId),
    };
  }

  updateFavoriteNote(id: string, personalNote: string): FavoriteItem | undefined {
    const db = this.readDb();
    const idx = db.favorites.findIndex((f) => f.id === id);
    if (idx === -1) return undefined;
    db.favorites[idx] = { ...db.favorites[idx], personalNote };
    this.writeDb(db);
    return {
      ...db.favorites[idx],
      post: db.posts.find((p) => p.id === db.favorites[idx].postId),
    };
  }

  deleteFavorite(id: string): boolean {
    const db = this.readDb();
    const initLen = db.favorites.length;
    db.favorites = db.favorites.filter((f) => f.id !== id);
    if (db.favorites.length < initLen) {
      this.writeDb(db);
      return true;
    }
    return false;
  }

  // ==========================================
  // NOTIFICATIONS (REAL PERSISTENCE)
  // ==========================================
  getNotifications(userId?: string, email?: string): MatchNotification[] {
    const db = this.readDb();
    let notifs = db.notifications || [];
    if (userId || email) {
      notifs = notifs.filter(
        (n) =>
          !n.targetUserId ||
          n.targetUserId === userId ||
          (email && n.targetUserEmail?.toLowerCase() === email.toLowerCase())
      );
    }
    return notifs;
  }

  saveNotifications(newNotifs: MatchNotification[]): void {
    if (newNotifs.length === 0) return;
    const db = this.readDb();
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(...newNotifs);
    this.writeDb(db);
  }

  markNotificationAsRead(id: string): void {
    const db = this.readDb();
    if (!db.notifications) return;
    const notif = db.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.writeDb(db);
    }
  }

  markAllNotificationsAsRead(userId?: string): void {
    const db = this.readDb();
    if (!db.notifications) return;
    db.notifications.forEach((n) => {
      if (!userId || n.targetUserId === userId) {
        n.isRead = true;
      }
    });
    this.writeDb(db);
  }

  clearNotifications(userId?: string): void {
    const db = this.readDb();
    if (!db.notifications) return;
    if (userId) {
      db.notifications = db.notifications.filter((n) => n.targetUserId !== userId);
    } else {
      db.notifications = [];
    }
    this.writeDb(db);
  }

  // ⏳ ตรวจสอบโพสต์ที่ยังไม่เสร็จสิ้นและค้างเกิน 14 วัน เพื่อสร้างการแจ้งเตือนต่ออายุโพสต์
  checkAndGenerateExpiringPostReminders(olderThanDays: number = 14): MatchNotification[] {
    const db = this.readDb();
    const now = Date.now();
    const cutoffMs = olderThanDays * 24 * 60 * 60 * 1000;
    const newReminders: MatchNotification[] = [];

    if (!db.notifications) db.notifications = [];

    db.posts.forEach((p) => {
      // พิจารณาเฉพาะโพสต์ที่ยังไม่ส่งคืน และได้รับการอนุมัติแล้ว
      if (p.status === 'returned' || p.isApproved === false || p.moderationStatus === 'rejected' || p.moderationStatus === 'hidden') {
        return;
      }

      let postDate = new Date(p.createdAt).getTime();
      if (isNaN(postDate) && p.dateTime) {
        postDate = now - (15 * 24 * 60 * 60 * 1000);
      }

      // ตรวจสอบว่าเก่าเกิน cutoff หรือไม่
      if (now - postDate >= cutoffMs) {
        // ตรวจสอบว่าเคยส่งการแจ้งเตือนเตือนความจำของโพสต์นี้ไปแล้วหรือยัง
        const alreadyNotified = db.notifications.some(
          (n) => n.type === 'post_expiry_reminder' && n.sourcePostId === p.id
        );

        if (!alreadyNotified) {
          const reminder: MatchNotification = {
            id: `notif-exp-${Date.now()}-${Math.floor(Math.random() * 1000)}-${p.id.slice(-4)}`,
            targetUserId: p.userId,
            targetUserEmail: p.userEmail,
            type: 'post_expiry_reminder',
            sourcePostId: p.id,
            matchedPostId: p.id,
            sourcePostTitle: p.title,
            matchedPostTitle: 'เตือนความจำ: โพสต์ของคุณยังตามหาอยู่หรือไม่? ⏳',
            matchScore: 100,
            category: p.category,
            color: p.color,
            location: p.location,
            matchedWithUserName: 'ระบบ SUT Lost & Found',
            matchedWithContact: `โพสต์นี้เผยแพร่มาเกิน ${olderThanDays} วันแล้ว หากพบของแล้วโปรดอัปเดตสถานะ`,
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          newReminders.push(reminder);
          db.notifications.unshift(reminder);
        }
      }
    });

    if (newReminders.length > 0) {
      this.writeDb(db);
    }
    return newReminders;
  }

  // ==========================================
  // IN-APP DIRECT CHAT MESSAGES (REAL PERSISTENCE)
  // ==========================================
  getMessages(postId?: string, userA?: string, userB?: string): ChatMessage[] {
    const db = this.readDb();
    let messages = db.messages || [];

    if (postId) {
      messages = messages.filter((m) => m.postId === postId);
    }
    if (userA && userB) {
      messages = messages.filter(
        (m) =>
          (m.senderId === userA && m.receiverId === userB) ||
          (m.senderId === userB && m.receiverId === userA)
      );
    }
    return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  sendMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage {
    const db = this.readDb();
    if (!db.messages) db.messages = [];

    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    db.messages.push(newMsg);
    this.writeDb(db);
    return newMsg;
  }

  // ==========================================
  // POST REPORT MANAGEMENT (RQ-REPORT)
  // ==========================================
  getReports(status?: string): PostReport[] {
    const db = this.readDb();
    let reports = Array.isArray(db.reports) ? [...db.reports] : [];
    if (status && status !== 'all') {
      reports = reports.filter((r) => r && r.status === status);
    }
    return reports.sort((a, b) => {
      const timeA = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  createReport(reportData: Omit<PostReport, 'id' | 'createdAt' | 'status'>): PostReport {
    const db = this.readDb();
    if (!db.reports) db.reports = [];

    const newReport: PostReport = {
      ...reportData,
      id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.reports.unshift(newReport);

    // Update post report count and flag
    const post = db.posts.find((p) => p.id === reportData.postId);
    if (post) {
      post.isReported = true;
      post.reportCount = (post.reportCount || 0) + 1;
      post.reportReason = reportData.reasonText;
    }

    this.writeDb(db);
    return newReport;
  }

  handleReportAction(reportId: string, action: 'hide' | 'delete' | 'dismiss'): { success: boolean; message: string; report?: PostReport } {
    const db = this.readDb();
    if (!db.reports) db.reports = [];

    const report = db.reports.find((r) => r.id === reportId);
    if (!report) {
      return { success: false, message: 'ไม่พบรายงานนี้ในระบบ' };
    }

    if (action === 'hide') {
      // ซ่อนโพสต์
      const post = db.posts.find((p) => p.id === report.postId);
      if (post) {
        post.isApproved = false;
        post.moderationStatus = 'hidden';
        post.moderationNotes = `⏸️ โพสต์ถูกซ่อนโดยแอดมิน เนื่องจากถูกรายงาน: ${report.reasonText}`;
      }
      report.status = 'resolved';
      report.actionTaken = 'hidden';
      this.writeDb(db);
      return { success: true, message: 'ซ่อนโพสต์ที่มีปัญหาเรียบร้อยแล้ว (ไม่แสดงบนฟีดสาธารณะ)', report };
    } else if (action === 'delete') {
      // ลบโพสต์ถาวร
      db.posts = db.posts.filter((p) => p.id !== report.postId);
      report.status = 'resolved';
      report.actionTaken = 'deleted';
      this.writeDb(db);
      return { success: true, message: 'ลบโพสต์ที่มีปัญหาออกจากระบบอย่างถาวรเรียบร้อยแล้ว', report };
    } else if (action === 'dismiss') {
      // ยกเลิกรายงาน / ปล่อยผ่าน
      report.status = 'dismissed';
      report.actionTaken = 'dismissed';
      const post = db.posts.find((p) => p.id === report.postId);
      if (post) {
        post.isReported = false;
      }
      this.writeDb(db);
      return { success: true, message: 'ยกเลิกการรายงาน โพสต์ยังคงแสดงผลตามปกติ', report };
    }

    return { success: false, message: 'การดำเนินการไม่ถูกต้อง' };
  }

  // ==========================================
  // STATS DASHBOARD (RQ-014)
  // ==========================================
  getStats(): MonthlyStats {
    const db = this.readDb();
    const totalLost = db.posts.filter((p) => p.type === 'lost').length;
    const totalFound = db.posts.filter((p) => p.type === 'found').length;
    const totalReturned = db.posts.filter((p) => p.status === 'returned').length;
    const totalUnfound = db.posts.filter((p) => p.type === 'lost' && p.status === 'lost').length;
    const returnRatePercentage =
      totalLost + totalFound > 0
        ? Math.round((totalReturned / (totalLost + totalFound)) * 100)
        : 0;

    const categoryMap: { [key: string]: number } = {};
    const locationMap: { [key: string]: number } = {};

    db.posts.forEach((p) => {
      categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
      locationMap[p.location] = (locationMap[p.location] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }));

    const locationBreakdown = Object.entries(locationMap).map(([location, count]) => ({
      location,
      count,
    }));

    const monthDefs = [
      { name: 'ม.ค. 69', m: 0 },
      { name: 'ก.พ. 69', m: 1 },
      { name: 'มี.ค. 69', m: 2 },
      { name: 'เม.ย. 69', m: 3 },
      { name: 'พ.ค. 69', m: 4 },
      { name: 'มิ.ย. 69', m: 5 },
      { name: 'ก.ค. 69', m: 6 },
      { name: 'ส.ค. 69', m: 7 },
      { name: 'ก.ย. 69', m: 8 },
    ];

    const monthlyTrend = monthDefs.map(({ name, m }) => {
      const postsInMonth = db.posts.filter((p) => {
        let d = new Date(p.createdAt);
        if (isNaN(d.getTime()) && p.dateTime) {
          const parts = p.dateTime.split(' ')[0]?.split('/');
          if (parts && parts.length === 3) {
            return parseInt(parts[1], 10) - 1 === m;
          }
        }
        return !isNaN(d.getTime()) && d.getMonth() === m;
      });
      const lost = postsInMonth.filter((p) => p.type === 'lost').length;
      const found = postsInMonth.filter((p) => p.type === 'found').length;
      const returned = postsInMonth.filter((p) => p.status === 'returned').length;
      const unfound = postsInMonth.filter((p) => p.type === 'lost' && p.status === 'lost').length;
      return { month: name, lost, found, returned, unfound };
    });

    return {
      totalLost,
      totalFound,
      totalReturned,
      totalUnfound,
      returnRatePercentage,
      categoryBreakdown,
      locationBreakdown,
      monthlyTrend,
    };
  }

  // ==========================================
  // QUARTERLY STATS DASHBOARD (รายงานประจำไตรมาส)
  // ==========================================
  getQuarterlyStats(selectedQuarter: number = 3, selectedYear: number = 2569): QuarterlyStats {
    const db = this.readDb();
    const quarterNames: { [key: number]: string } = {
      1: 'ไตรมาส 1 (ม.ค. - มี.ค.)',
      2: 'ไตรมาส 2 (เม.ย. - มิ.ย.)',
      3: 'ไตรมาส 3 (ก.ค. - ก.ย.)',
      4: 'ไตรมาส 4 (ต.ค. - ธ.ค.)',
    };

    // คัดกรองโพสต์ที่อยู่ในไตรมาสที่เลือก
    const quarterPosts = db.posts.filter((p) => {
      let d = new Date(p.createdAt);
      if (isNaN(d.getTime()) && p.dateTime) {
        const parts = p.dateTime.split(' ')[0]?.split('/');
        if (parts && parts.length === 3) {
          const month = parseInt(parts[1], 10) - 1;
          const q = Math.floor(month / 3) + 1;
          return q === selectedQuarter;
        }
      }
      const month = isNaN(d.getTime()) ? 8 : d.getMonth(); // default September (month 8, Q3)
      const q = Math.floor(month / 3) + 1;
      return q === selectedQuarter;
    });

    // 1. จำนวนของหายทั้งหมดในไตรมาสนั้น
    const totalLost = quarterPosts.filter((p) => p.type === 'lost').length;
    // 2. จำนวนของที่ถูกส่งคืนทั้งหมดในไตรมาสนั้น
    const totalReturned = quarterPosts.filter((p) => p.status === 'returned').length;
    // 3. จำนวนของที่หาพบแล้วแต่ยังไม่ถูกส่งคืนในไตรมาสนั้น
    const foundNotReturned = quarterPosts.filter((p) => p.type === 'found' && p.status !== 'returned').length;
    // 4. จำนวนของที่ยังหาไม่เจอทั้งหมดในไตรมาสนั้น
    const unfoundLost = quarterPosts.filter((p) => p.type === 'lost' && p.status === 'lost').length;

    // 5. 5 อันดับแรกของหมวดหมู่ของของที่หายบ่อยที่สุด
    const lostCategoryCountMap: { [cat: string]: number } = {};
    quarterPosts
      .filter((p) => p.type === 'lost')
      .forEach((p) => {
        const cat = p.category || 'อื่นๆ';
        lostCategoryCountMap[cat] = (lostCategoryCountMap[cat] || 0) + 1;
      });

    const sortedLostCats = Object.entries(lostCategoryCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const top5LostCategories: TopCategoryStat[] = sortedLostCats.map(([category, count], idx) => ({
      rank: idx + 1,
      category,
      count,
      percentage: totalLost > 0 ? Math.round((count / totalLost) * 100) : 0,
    }));

    const totalFoundInQ = quarterPosts.filter((p) => p.type === 'found').length;
    const returnRatePercentage =
      totalLost + totalFoundInQ > 0
        ? Math.round((totalReturned / (totalLost + totalFoundInQ)) * 100)
        : 0;

    return {
      quarter: selectedQuarter,
      quarterName: quarterNames[selectedQuarter] || `ไตรมาส ${selectedQuarter}`,
      year: selectedYear,
      totalLost,
      totalReturned,
      foundNotReturned,
      unfoundLost,
      top5LostCategories,
      returnRatePercentage,
    };
  }
}

// Global Singleton for Database instance across Next.js API Routes
const globalForDb = global as unknown as { persistentDb?: PersistentDatabase };
export const persistentDb = globalForDb.persistentDb || new PersistentDatabase();
if (process.env.NODE_ENV !== 'production') globalForDb.persistentDb = persistentDb;
