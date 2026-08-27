import { PostItem, User, FavoriteItem, MatchNotification } from '../types';

/**
 * =========================================================================
 * 📦 ข้อมูลเริ่มต้นแบบคลีน (Clean Initial Mock Data)
 * =========================================================================
 * 💡 ข้อมูลเริ่มต้นแบบโล่ง ไม่มีโพสต์หรือแชทค้างเก่า พร้อมให้เริ่มใช้งานใหม่
 * =========================================================================
 */

export const INITIAL_USER: User = {
  id: 'usr-001',
  studentId: 'B6802189',
  fullName: 'ศิวะพร ภูดินทราย',
  email: 'b6802189@g.sut.ac.th',
  phone: '089-123-4567',
  role: 'student',
};

export const INITIAL_POSTS: PostItem[] = [];

export const INITIAL_FAVORITES: FavoriteItem[] = [];

export const INITIAL_NOTIFICATIONS: MatchNotification[] = [];
