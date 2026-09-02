import { PostItem, User, FavoriteItem, MatchNotification } from '../types';

/**
 * =========================================================================
 * 📦 ข้อมูลเริ่มต้นระบบ SUT Lost & Found (Clean State สำหรับทดสอบระบบจริง)
 * =========================================================================
 */

export const INITIAL_USER: User = {
  id: 'usr-admin',
  studentId: 'ADMIN-01',
  fullName: 'ผู้ดูแลระบบ สหกรณ์/รปภ. มทส.',
  email: 'admin_lostfound@sut.ac.th',
  phone: '044-225-789',
  role: 'admin',
};

export const INITIAL_POSTS: PostItem[] = [];

export const INITIAL_FAVORITES: FavoriteItem[] = [];

export const INITIAL_NOTIFICATIONS: MatchNotification[] = [];
