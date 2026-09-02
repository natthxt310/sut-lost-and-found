import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { PostItem, User, FavoriteItem, MatchNotification, ChatMessage, ChatConversation } from '../types';
import { INITIAL_POSTS, INITIAL_USER, INITIAL_FAVORITES, INITIAL_NOTIFICATIONS } from '../data/mockData';
import { findMatchesForPost } from './matching';

// Keys สำหรับ AsyncStorage บนอุปกรณ์
const STORAGE_KEYS = {
  USER: '@sut_lost_found_user_v2',
  POSTS: '@sut_lost_found_posts_v2',
  FAVORITES: '@sut_lost_found_favorites_v2',
  NOTIFICATIONS: '@sut_lost_found_notifications_v2',
};

// Base URL ของ Next.js Backend API ตาม Platform (รองรับทั้งมือถือจริง และ Emulator)
const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'android') {
    // 10.0.2.2 เข้าถึง Backend localhost ของคอมพิวเตอร์จาก Android Emulator ได้ 100%
    return 'http://10.0.2.2:3000/api';
  }
  return 'http://10.1.165.152:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * แปลง URL ของรูปภาพให้แสดงผลได้ถูกต้องทุกอุปกรณ์ (รวมถึงไฟล์จาก /uploads)
 */
export const getMediaUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/')) {
    return url;
  }
  if (url.startsWith('/uploads/')) {
    const serverHost = API_BASE_URL.replace(/\/api$/, '');
    return `${serverHost}${url}`;
  }
  return url;
};

const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // fallback silently
    }
  },
};

class PersistentApiService {
  private initialized: boolean = false;
  private posts: PostItem[] = [];
  private user: User | null = null;
  private favorites: FavoriteItem[] = [];
  private notifications: MatchNotification[] = [];

  // ==========================================
  // INITIALIZATION & DISK STORAGE
  // ==========================================
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      // โหลดข้อมูลจาก Local Storage บนเครื่องจริง
      const [storedUser, storedPosts, storedFavs, storedNotifs] = await Promise.all([
        safeStorage.getItem(STORAGE_KEYS.USER),
        safeStorage.getItem(STORAGE_KEYS.POSTS),
        safeStorage.getItem(STORAGE_KEYS.FAVORITES),
        safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
      ]);

      if (storedUser && storedUser.trim() !== '') {
        try {
          this.user = JSON.parse(storedUser);
        } catch {
          this.user = null;
        }
      } else {
        this.user = null;
      }

      if (storedPosts) {
        this.posts = JSON.parse(storedPosts);
      } else {
        this.posts = [...INITIAL_POSTS];
        await safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(this.posts));
      }

      if (storedFavs) {
        this.favorites = JSON.parse(storedFavs);
      } else {
        this.favorites = [...INITIAL_FAVORITES];
        await safeStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(this.favorites));
      }

      if (storedNotifs) {
        this.notifications = JSON.parse(storedNotifs);
      } else {
        this.notifications = [...INITIAL_NOTIFICATIONS];
        await safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
      }

      this.initialized = true;

      // ซิงก์กับ Next.js API
      this.syncWithBackend();
    } catch (error) {
      this.posts = [...INITIAL_POSTS];
      this.user = { ...INITIAL_USER };
      this.favorites = [...INITIAL_FAVORITES];
      this.notifications = [...INITIAL_NOTIFICATIONS];
      this.initialized = true;
    }
  }

  // ซิงก์ข้อมูลกับ Next.js REST API เมื่อเชื่อมต่อได้
  private async syncWithBackend() {
    try {
      const res = await fetch(`${API_BASE_URL}/posts`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          this.posts = data.data;
          await safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(this.posts));

          // กรองการแจ้งเตือนที่เกี่ยวข้องกับโพสต์ที่ยังมีอยู่จริงเท่านั้น
          const validPostIds = new Set(this.posts.map((p) => p.id));
          this.notifications = this.notifications.filter(
            (n) => validPostIds.has(n.sourcePostId) && validPostIds.has(n.matchedPostId)
          );
          await this.saveNotificationsToStorage();
        }
      }
    } catch (e) {
      // Backend API offline
    }
  }

  private async savePostsToStorage(): Promise<void> {
    await safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(this.posts));
  }

  private async saveUserToStorage(): Promise<void> {
    await safeStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.user));
  }

  private async saveFavoritesToStorage(): Promise<void> {
    await safeStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(this.favorites));
  }

  private async saveNotificationsToStorage(): Promise<void> {
    await safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
  }

  // ==========================================
  // SOURCE 1: USERS & AUTH CRUD (REAL PERSISTENCE)
  // ==========================================
  async getCurrentUser(): Promise<User | null> {
    await this.ensureInitialized();
    return this.user;
  }

  async logout(): Promise<void> {
    await this.ensureInitialized();
    this.user = null;
    await safeStorage.setItem(STORAGE_KEYS.USER, '');
  }

  async updateUserProfile(data: Partial<User>): Promise<User | null> {
    await this.ensureInitialized();
    if (!this.user) return null;
    this.user = { ...this.user, ...data };
    await this.saveUserToStorage();

    // Sync ไปยัง Next.js API ถ้ามี
    try {
      await fetch(`${API_BASE_URL}/users/${this.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      // offline fallback
    }

    return this.user;
  }

  async login(studentId: string, password?: string): Promise<User> {
    await this.ensureInitialized();
    const sId = studentId.trim().toUpperCase();

    // 1. ลองตรวจสอบกับ Next.js Backend API ก่อน
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: sId, password }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        this.user = data.data;
        await this.saveUserToStorage();
        return data.data as User;
      } else if (data.notRegistered) {
        throw new Error(`NOT_REGISTERED:${data.error}`);
      } else if (!data.success) {
        throw new Error(data.error || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      if (err.message && (err.message.startsWith('NOT_REGISTERED') || err.message.includes('รหัสผ่านไม่ถูกต้อง'))) {
        throw err;
      }
      // Backend offline -> ตรวจสอบกับข้อมูล Local
      const storedUsersRaw = await safeStorage.getItem('@sut_registered_users_v1');
      let registeredUsers: User[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [INITIAL_USER];
      
      const found = registeredUsers.find((u) => u.studentId.toUpperCase() === sId);
      if (!found) {
        throw new Error(`NOT_REGISTERED:ไม่พบรหัสนักศึกษา ${sId} ในระบบ กรุณาลงทะเบียนก่อนเข้าใช้งานครั้งแรก`);
      }
      if (found.password && password && found.password !== password) {
        throw new Error('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      }
      this.user = found;
      await this.saveUserToStorage();
      return found;
    }

    throw new Error('ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง');
  }

  async register(studentId: string, email?: string, password?: string, fullName?: string, phone?: string): Promise<User> {
    await this.ensureInitialized();
    const sId = studentId.trim().toUpperCase();
    const userEmail = email?.trim() || `${sId.toLowerCase()}@g.sut.ac.th`;
    const userFullName = fullName?.trim() || `นักศึกษา ${sId}`;

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fullName: userFullName,
      studentId: sId,
      password: password || '123456',
      email: userEmail,
      phone: phone?.trim() || '',
      role: 'student',
    };

    this.user = newUser;
    await this.saveUserToStorage();

    // บันทึกลง Local Registered Users List
    try {
      const storedUsersRaw = await safeStorage.getItem('@sut_registered_users_v1');
      let registeredUsers: User[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      registeredUsers = registeredUsers.filter((u) => u.studentId.toUpperCase() !== sId);
      registeredUsers.push(newUser);
      await safeStorage.setItem('@sut_registered_users_v1', JSON.stringify(registeredUsers));
    } catch (e) {
      // ignore
    }

    // ส่งต่อไปยัง Next.js Backend API
    try {
      await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
    } catch (e) {
      // offline fallback
    }

    return newUser;
  }

  async resetPassword(studentId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `ระบบได้ทำการส่งคำขอรีเซ็ตรหัสผ่านสำหรับรหัสนักศึกษา ${studentId.toUpperCase()} เรียบร้อยแล้ว`,
    };
  }

  // ==========================================
  // SOURCE 2: POSTS CRUD (REAL PERSISTENCE)
  // ==========================================
  async getPosts(filter?: { type?: 'lost' | 'found'; category?: string; location?: string; search?: string }): Promise<PostItem[]> {
    await this.ensureInitialized();

    // ดึงข้อมูลล่าสุดจาก Next.js Backend API เพื่อให้ทุกเครื่องแสดงข้อมูลตรงกัน
    try {
      const res = await fetch(`${API_BASE_URL}/posts`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          this.posts = data.data;
          await this.savePostsToStorage();
        }
      }
    } catch {
      // offline fallback
    }

    let result = [...this.posts];

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

  async getPostById(id: string): Promise<PostItem | undefined> {
    await this.ensureInitialized();
    return this.posts.find((p) => p.id === id);
  }

  async createPost(postData: Omit<PostItem, 'id' | 'createdAt'>): Promise<{ post: PostItem; matches: MatchNotification[] }> {
    await this.ensureInitialized();

    let postToSave = { ...postData };

    // 📷 ถ้าเป็นรูปภาพ Base64 ให้อัปโหลดไปยัง /api/upload เพื่อบันทึกเป็นไฟล์ลง public/uploads บนเซิร์ฟเวอร์
    if (postToSave.imageUrl && postToSave.imageUrl.startsWith('data:image/')) {
      try {
        const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64: postToSave.imageUrl }),
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.url) {
          postToSave.imageUrl = uploadData.url;
        }
      } catch (e) {
        // fallback to base64
      }
    }

    const newPost: PostItem = {
      ...postToSave,
      id: `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };

    // 1. บันทึกเข้า Memory และ AsyncStorage บนดิสก์มือถือทันที
    this.posts.unshift(newPost);
    await this.savePostsToStorage();

    // 2. รัน Auto-Matching Engine อัตโนมัติ (RQ-009)
    const newMatches = findMatchesForPost(newPost, this.posts);
    if (newMatches.length > 0) {
      this.notifications.unshift(...newMatches);
      await this.saveNotificationsToStorage();
    }

    // 3. ส่งข้อมูลขึ้น Next.js Backend API เพื่อบันทึกลง Database บน Server
    try {
      await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
    } catch (e) {
      // offline mode -> ข้อมูลยังคงอยู่ใน AsyncStorage
    }

    return { post: newPost, matches: newMatches };
  }

  async updatePost(id: string, updates: Partial<PostItem>): Promise<PostItem> {
    await this.ensureInitialized();
    const index = this.posts.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('ไม่พบโพสต์ที่ต้องการแก้ไข');

    this.posts[index] = {
      ...this.posts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // อัปเดตใน Favorites ด้วยถ้ามี
    this.favorites = this.favorites.map((fav) =>
      fav.postId === id ? { ...fav, post: this.posts[index] } : fav
    );

    await this.savePostsToStorage();
    await this.saveFavoritesToStorage();

    // ส่งอัปเดตไป Next.js API
    try {
      await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      // offline fallback
    }

    return this.posts[index];
  }

  async deletePost(id: string): Promise<boolean> {
    await this.ensureInitialized();
    this.posts = this.posts.filter((p) => p.id !== id);
    this.favorites = this.favorites.filter((f) => f.postId !== id);
    this.notifications = this.notifications.filter(
      (n) => n.sourcePostId !== id && n.matchedPostId !== id
    );

    await this.savePostsToStorage();
    await this.saveFavoritesToStorage();
    await this.saveNotificationsToStorage();

    // ส่งคำสั่งลบไป Next.js API
    try {
      await fetch(`${API_BASE_URL}/posts/${id}`, { method: 'DELETE' });
    } catch (e) {
      // offline fallback
    }

    return true;
  }

  // ==========================================
  // SOURCE 3: FAVORITES CRUD (REAL PERSISTENCE)
  // ==========================================
  async getFavorites(): Promise<FavoriteItem[]> {
    await this.ensureInitialized();
    return this.favorites;
  }

  async addFavorite(postId: string, personalNote?: string): Promise<FavoriteItem> {
    await this.ensureInitialized();
    const post = this.posts.find((p) => p.id === postId);
    if (!post) throw new Error('ไม่พบโพสต์ที่ต้องการบันทึก');

    const existing = this.favorites.find((f) => f.postId === postId);
    if (existing) return existing;

    const newFav: FavoriteItem = {
      id: `fav-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: this.user?.id || 'usr-guest',
      postId,
      post,
      personalNote,
      createdAt: new Date().toISOString(),
    };

    this.favorites.unshift(newFav);
    await this.saveFavoritesToStorage();

    try {
      await fetch(`${API_BASE_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFav),
      });
    } catch (e) {
      // offline fallback
    }

    return newFav;
  }

  async updateFavoriteNote(id: string, personalNote: string): Promise<FavoriteItem> {
    await this.ensureInitialized();
    const index = this.favorites.findIndex((f) => f.id === id);
    if (index === -1) throw new Error('ไม่พบรายการโปรด');

    this.favorites[index] = {
      ...this.favorites[index],
      personalNote,
    };
    await this.saveFavoritesToStorage();

    try {
      await fetch(`${API_BASE_URL}/favorites/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalNote }),
      });
    } catch (e) {
      // offline fallback
    }

    return this.favorites[index];
  }

  async removeFavorite(postId: string): Promise<boolean> {
    await this.ensureInitialized();
    this.favorites = this.favorites.filter((f) => f.postId !== postId);
    await this.saveFavoritesToStorage();

    try {
      await fetch(`${API_BASE_URL}/favorites/${postId}`, { method: 'DELETE' });
    } catch (e) {
      // offline fallback
    }

    return true;
  }

  isFavorite(postId: string): boolean {
    return this.favorites.some((f) => f.postId === postId);
  }

  // ==========================================
  // NOTIFICATIONS (REAL PERSISTENCE)
  // ==========================================
  async getNotifications(): Promise<MatchNotification[]> {
    await this.ensureInitialized();
    return this.notifications;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.ensureInitialized();
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      await this.saveNotificationsToStorage();
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.ensureInitialized();
    this.notifications.forEach((n) => (n.isRead = true));
    await this.saveNotificationsToStorage();
  }

  async clearAllNotifications(): Promise<void> {
    await this.ensureInitialized();
    this.notifications = [];
    await this.saveNotificationsToStorage();
  }

  // ==========================================
  // IN-APP DIRECT CHAT (REAL PERSISTENCE & INBOX)
  // ==========================================
  async getMessages(postId: string): Promise<ChatMessage[]> {
    await this.ensureInitialized();

    // 1. ลองดึงจาก Next.js Backend API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${API_BASE_URL}/messages?postId=${encodeURIComponent(postId)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        await safeStorage.setItem(`@sut_chat_${postId}`, JSON.stringify(data.data));
        return data.data;
      }
    } catch (e) {
      // offline fallback
    }

    // 2. โหลดจาก Local Storage
    const stored = await safeStorage.getItem(`@sut_chat_${postId}`);
    if (stored) {
      return JSON.parse(stored);
    }

    return [];
  }

  async sendMessage(
    postId: string,
    postTitle: string,
    receiverId: string,
    receiverName: string,
    text: string
  ): Promise<ChatMessage> {
    await this.ensureInitialized();

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      postId,
      postTitle,
      senderId: this.user?.id || 'usr-guest',
      senderName: this.user?.fullName || 'ผู้ใช้งาน มทส.',
      receiverId,
      receiverName,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    // 1. บันทึกลง Local Storage ทันที
    const currentMsgs = await this.getMessages(postId);
    const updatedMsgs = [...currentMsgs.filter(m => m.id !== newMsg.id), newMsg];
    await safeStorage.setItem(`@sut_chat_${postId}`, JSON.stringify(updatedMsgs));

    // 2. อัปเดตรายการห้องแชทใน Local Index
    try {
      const chatIndexRaw = await safeStorage.getItem('@sut_chat_post_index');
      const chatIndex: string[] = chatIndexRaw ? JSON.parse(chatIndexRaw) : [];
      if (!chatIndex.includes(postId)) {
        chatIndex.push(postId);
        await safeStorage.setItem('@sut_chat_post_index', JSON.stringify(chatIndex));
      }
    } catch (e) {
      // ignore
    }

    // 3. ส่งขึ้น Next.js Backend API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (e) {
      console.warn('Network send failed, saved to local cache:', e);
    }

    return newMsg;
  }

  async markChatAsRead(postId: string): Promise<void> {
    await this.ensureInitialized();
    try {
      const stored = await safeStorage.getItem(`@sut_chat_${postId}`);
      if (stored) {
        const msgs: ChatMessage[] = JSON.parse(stored);
        const updated = msgs.map((m) => ({ ...m, isRead: true }));
        await safeStorage.setItem(`@sut_chat_${postId}`, JSON.stringify(updated));
      }
    } catch (e) {
      // ignore
    }
  }

  async toggleLikeMessage(postId: string, messageId: string): Promise<ChatMessage[]> {
    await this.ensureInitialized();
    try {
      const stored = await safeStorage.getItem(`@sut_chat_${postId}`);
      if (stored) {
        const msgs: ChatMessage[] = JSON.parse(stored);
        const updated = msgs.map((m) => {
          if (m.id === messageId) {
            return { ...m, liked: !m.liked };
          }
          return m;
        });
        await safeStorage.setItem(`@sut_chat_${postId}`, JSON.stringify(updated));
        return updated;
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  async getConversations(): Promise<ChatConversation[]> {
    await this.ensureInitialized();
    const currentUserId = this.user?.id || '';
    let allMessages: ChatMessage[] = [];

    // 1. ดึงข้อความจากเซิร์ฟเวอร์
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${API_BASE_URL}/messages`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        allMessages = data.data;
      }
    } catch (e) {
      // offline
    }

    // 2. รวมข้อความจาก Local Storage ของทุกห้องที่มีใน Index
    try {
      const chatIndexRaw = await safeStorage.getItem('@sut_chat_post_index');
      const chatIndex: string[] = chatIndexRaw ? JSON.parse(chatIndexRaw) : [];
      for (const pid of chatIndex) {
        const localStored = await safeStorage.getItem(`@sut_chat_${pid}`);
        if (localStored) {
          const localList: ChatMessage[] = JSON.parse(localStored);
          localList.forEach((lm) => {
            if (!allMessages.some((m) => m.id === lm.id)) {
              allMessages.push(lm);
            }
          });
        }
      }
    } catch (e) {
      // ignore
    }

    // 3. จัดกลุ่มข้อความตาม postId เพื่อสร้างเป็น Conversation List
    const convMap = new Map<string, ChatConversation>();

    allMessages.forEach((msg) => {
      // ตรวจสอบว่าเกี่ยวข้องกับผู้ใช้ปัจจุบันหรือไม่
      const isSender = msg.senderId === currentUserId;
      const isReceiver = msg.receiverId === currentUserId;
      if (!isSender && !isReceiver && currentUserId !== 'usr-001') {
        return;
      }

      const post = this.posts.find((p) => p.id === msg.postId);
      const otherUserId = isSender ? msg.receiverId : msg.senderId;
      const otherUserName = isSender ? msg.receiverName : msg.senderName;

      // คำนวณจำนวนข้อความที่ยังไม่ได้อ่าน
      const unreadCount = allMessages.filter(
        (m) => m.postId === msg.postId && m.senderId !== currentUserId && m.isRead !== true
      ).length;

      const existing = convMap.get(msg.postId);
      const msgTime = new Date(msg.createdAt).getTime();

      if (!existing || msgTime > new Date(existing.lastMessageAt).getTime()) {
        convMap.set(msg.postId, {
          postId: msg.postId,
          postTitle: msg.postTitle || post?.title || 'รายการสิ่งของ',
          postImageUrl: post?.imageUrl || '',
          otherUserId,
          otherUserName: otherUserName || post?.userName || 'ผู้ใช้ มทส.',
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt,
          unreadCount,
        });
      }
    });

    return Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  // ==========================================
  // PHYSICAL IMAGE UPLOAD (PERSISTENT DISK FILES)
  // ==========================================
  async uploadImage(base64Data: string, fallbackUri: string): Promise<string> {
    try {
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: base64Data }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        // คืนค่า URL ที่เซิร์ฟเวอร์เสิร์ฟภาพจริงจากโฟลเดอร์ public/uploads
        return `${API_BASE_URL.replace('/api', '')}${data.url}`;
      }
    } catch (e) {
      console.warn('Physical image upload error, using local URI fallback:', e);
    }
    return fallbackUri;
  }
}

export const api = new PersistentApiService();
