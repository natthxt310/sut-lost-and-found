export type PostType = 'lost' | 'found';

export type ItemStatus = 'lost' | 'found' | 'returned';

export interface PostItem {
  id: string;
  type: PostType; // 'lost' = ของหาย, 'found' = พบของ
  title: string;
  category: string;
  color: string;
  location: string;
  dateTime: string;
  description: string;
  imageUrl: string;
  status: ItemStatus; // 'lost' = ยังไม่เจอ, 'found' = เจอแล้ว, 'returned' = ส่งคืนเรียบร้อย
  userId: string;
  userName: string;
  userContact: string;
  userEmail: string;
  securityQuestion?: string;
  isApproved?: boolean;
  moderationStatus?: 'approved' | 'rejected' | 'flagged' | 'pending';
  moderationScore?: number;
  moderationNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  studentId: string;
  fullName: string;
  password?: string;
  email?: string;
  phone: string;
  role: 'student' | 'staff' | 'admin';
  avatar?: string;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  postId: string;
  post: PostItem;
  personalNote?: string;
  createdAt: string;
}

export interface MatchNotification {
  id: string;
  targetUserId?: string;
  targetUserEmail?: string;
  type?: 'lost' | 'found' | 'match' | 'message';
  sourcePostId: string;
  matchedPostId: string;
  sourcePostTitle: string;
  matchedPostTitle: string;
  matchScore: number;
  category: string;
  color: string;
  location: string;
  matchedWithUserName: string;
  matchedWithContact: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  postId: string;
  postTitle: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  text: string;
  liked?: boolean;
  isRead?: boolean;
  createdAt: string;
}

export interface ChatConversation {
  postId: string;
  postTitle: string;
  postImageUrl?: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface TopCategoryStat {
  rank: number;
  category: string;
  count: number;
  percentage: number;
}

export interface QuarterlyStats {
  quarter: number;
  quarterName: string;
  year: number;
  totalLost: number;
  totalReturned: number;
  foundNotReturned: number;
  unfoundLost: number;
  top5LostCategories: TopCategoryStat[];
  returnRatePercentage: number;
}

export const SUT_LOCATIONS = [
  'อาคารเรียนรวม 1 (B1)',
  'อาคารเรียนรวม 2 (B2)',
  'ศูนย์บรรณสารและสื่อการศึกษา (หอสมุด)',
  'โรงอาหารสุรนิเวศน์ (กาสะลอง)',
  'อาคารสุรพัฒน์ 1',
  'อาคารสุรพัฒน์ 2',
  'หอพักสุรนิเวศน์',
  'ศูนย์กีฬา (Suranaree Stadium)',
  'อาคารบริหาร มทส.',
  'ลานจอดรถจักรยานยนต์ B1',
  'ป้ายรถเมล์ มทส.',
  'อื่นๆ ใน มทส.',
];

export const ITEM_CATEGORIES = [
  'อุปกรณ์อิเล็กทรอนิกส์ / มือถือ',
  'เอกสาร / บัตรนักศึกษา / กระเป๋าสตางค์',
  'กุญแจรถ / พวงกุญแจ',
  'หูฟัง / AirPods / Gadgets',
  'แท็บเล็ต / iPad / โน้ตบุ๊ก',
  'แว่นตา / นาฬิกา / เครื่องประดับ',
  'เสื้อผ้า / หมวกกันน็อค',
  'อุปกรณ์การเรียน / หนังสือ',
  'อื่นๆ',
];

export const ITEM_COLORS = [
  'ดำ',
  'ขาว',
  'แดง',
  'น้ำเงิน',
  'ส้ม (สีแสด มทส.)',
  'เขียว',
  'เหลือง',
  'ชมพู',
  'เทา / เงิน',
  'ทอง',
  'ม่วง',
  'น้ำตาล',
  'หลากสี / ลวดลาย',
];
