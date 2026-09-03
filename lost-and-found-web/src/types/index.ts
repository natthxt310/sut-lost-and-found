export type PostType = 'lost' | 'found';
export type ItemStatus = 'lost' | 'found' | 'returned';

export interface PostItem {
  id: string;
  type: PostType; // 'lost' | 'found'
  title: string;
  category: string;
  color: string;
  location: string;
  dateTime: string;
  description: string;
  imageUrl: string;
  status: ItemStatus; // 'lost' | 'found' | 'returned'
  userId: string;
  userName: string;
  userContact: string;
  userEmail: string;
  securityQuestion?: string;
  isApproved?: boolean;
  moderationStatus?: 'approved' | 'rejected' | 'flagged' | 'pending' | 'hidden';
  moderationScore?: number;
  moderationNotes?: string;
  isReported?: boolean;
  reportCount?: number;
  reportReason?: string;
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
  createdAt: string;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  postId: string;
  post?: PostItem;
  personalNote?: string;
  createdAt: string;
}

export interface MatchNotification {
  id: string;
  targetUserId?: string;
  targetUserEmail?: string;
  type?: 'lost' | 'found' | 'match' | 'message' | 'approval_approved' | 'approval_rejected' | 'returned_thankyou' | 'post_expiry_reminder';
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

export interface MonthlyStats {
  totalLost: number;
  totalFound: number;
  totalReturned: number;
  totalUnfound?: number;
  returnRatePercentage: number;
  categoryBreakdown: { category: string; count: number }[];
  locationBreakdown: { location: string; count: number }[];
  monthlyTrend: { month: string; lost: number; found: number; returned: number; unfound?: number }[];
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

export interface PostReport {
  id: string;
  postId: string;
  postTitle: string;
  postImageUrl?: string;
  postCategory?: string;
  postAuthorName?: string;
  reporterId: string;
  reporterName: string;
  reason: 'spam' | 'offensive' | 'scam' | 'false_info' | 'other';
  reasonText: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  actionTaken?: 'hidden' | 'deleted' | 'dismissed' | 'unhidden' | 'approved';
  createdAt: string;
}

