import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { PostItem, User, FavoriteItem, MatchNotification, ChatConversation, ChatMessage } from '../types';
import { api } from '../services/api';
import {
  requestNotificationPermissions,
  triggerLocalPushNotification,
  formatNotification,
} from '../services/notificationService';

/**
 * =========================================================================
 * 🌐 Global App State Context (AppContext)
 * =========================================================================
 * 💡 อธิบายการทำงานแบบเข้าใจง่าย:
 * ทำหน้าที่เป็น "คลังข้อมูลส่วนกลางของแอป" ที่ทุกหน้าจอสามารถเข้าถึงข้อมูลเดียวกันได้
 * เช่น ข้อมูลผู้ใช้, โพสต์ทั้งหมด, รายการโปรด, การแจ้งเตือน, และประวัติการสนทนาแชท
 * พร้อมการคำนวณจำนวนแจ้งเตือนที่ยังไม่ได้อ่านเพื่อแสดงหรือเคลียร์ Badge บนแท็บบาร์
 * =========================================================================
 */

interface AppContextType {
  user: User | null;
  posts: PostItem[];
  favorites: FavoriteItem[];
  notifications: MatchNotification[];
  conversations: ChatConversation[];
  unreadNotifsCount: number;
  unreadChatCount: number;
  isLoading: boolean;
  selectedPost: PostItem | null;
  setSelectedPost: (post: PostItem | null) => void;
  activeInAppBanner: MatchNotification | null;
  dismissInAppBanner: () => void;
  triggerNotificationAlert: (notif: MatchNotification) => void;
  refreshData: () => Promise<void>;
  refreshConversations: () => Promise<void>;
  markChatAsRead: (postId: string) => Promise<void>;
  toggleLikeMessage: (postId: string, messageId: string) => Promise<ChatMessage[]>;
  createPost: (data: Omit<PostItem, 'id' | 'createdAt'>) => Promise<{ post: PostItem; matches: MatchNotification[] }>;
  updatePost: (id: string, updates: Partial<PostItem>) => Promise<PostItem>;
  approvePost: (id: string, isApproved?: boolean) => Promise<PostItem | undefined>;
  deletePost: (id: string) => Promise<boolean>;
  toggleFavorite: (postId: string, note?: string) => Promise<boolean>;
  updateFavoriteNote: (favId: string, note: string) => Promise<void>;
  isFavorite: (postId: string) => boolean;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  login: (studentId: string, password?: string) => Promise<void>;
  register: (studentId: string, email?: string, password?: string, fullName?: string, phone?: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [notifications, setNotifications] = useState<MatchNotification[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeInAppBanner, setActiveInAppBanner] = useState<MatchNotification | null>(null);

  const knownNotifIds = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef<boolean>(true);

  useEffect(() => {
    requestNotificationPermissions();
    // ตรวจสอบโพสต์เก่าในระบบเพื่อสร้างการแจ้งเตือนเตือนความจำต่ออายุ
    api.checkExpiringPosts?.();
  }, []);

  const triggerNotificationAlert = (notif: MatchNotification) => {
    const formatted = formatNotification(notif);
    triggerLocalPushNotification(formatted.title, formatted.subtitle, {
      id: notif.id,
      postId: notif.sourcePostId,
    });
    setActiveInAppBanner(notif);
  };

  const dismissInAppBanner = () => {
    setActiveInAppBanner(null);
  };

  const refreshConversations = async () => {
    try {
      const convs = await api.getConversations();
      setConversations(convs);
    } catch (e) {
      console.warn('Error refreshing conversations:', e);
    }
  };

  const markChatAsRead = async (postId: string) => {
    await api.markChatAsRead(postId);
    // อัปเดตรายการใน State ทันทีเพื่อให้ตัวเลขแจ้งเตือนที่แท็บบาร์หายไปทันที
    setConversations((prev) =>
      prev.map((c) => (c.postId === postId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const toggleLikeMessage = async (postId: string, messageId: string) => {
    return await api.toggleLikeMessage(postId, messageId);
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const [u, p, f, n, c] = await Promise.all([
        api.getCurrentUser(),
        api.getPosts(),
        api.getFavorites(),
        api.getNotifications(),
        api.getConversations(),
      ]);
      setUser(u);
      setPosts(p);
      setFavorites(f);
      setNotifications(n);
      setConversations(c);

      // ตรวจหาการแจ้งเตือนใหม่สำหรับยิง Push Notification และ In-App Toast Banner
      if (Array.isArray(n)) {
        if (isFirstLoadRef.current) {
          n.forEach((item) => knownNotifIds.current.add(item.id));
          isFirstLoadRef.current = false;
        } else {
          const newItems = n.filter((item) => !knownNotifIds.current.has(item.id));
          if (newItems.length > 0) {
            newItems.forEach((item) => knownNotifIds.current.add(item.id));
            triggerNotificationAlert(newItems[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing app data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();

    // ซิงก์ข้อมูลแจ้งเตือน โพสต์ และแชทอัตโนมัติในเบื้องหลังทุกๆ 7 วินาที
    const interval = setInterval(async () => {
      try {
        if (!user) return;
        const [p, n, c] = await Promise.all([
          api.getPosts(),
          api.getNotifications(),
          api.getConversations(),
        ]);
        setPosts(p);
        setNotifications(n);
        setConversations(c);

        if (Array.isArray(n)) {
          if (isFirstLoadRef.current) {
            n.forEach((item) => knownNotifIds.current.add(item.id));
            isFirstLoadRef.current = false;
          } else {
            const newItems = n.filter((item) => !knownNotifIds.current.has(item.id));
            if (newItems.length > 0) {
              newItems.forEach((item) => knownNotifIds.current.add(item.id));
              triggerNotificationAlert(newItems[0]);
            }
          }
        }
      } catch {
        // offline silent
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [user]);

  const createPost = async (data: Omit<PostItem, 'id' | 'createdAt'>) => {
    const result = await api.createPost(data);
    await refreshData();
    return result;
  };

  const updatePost = async (id: string, updates: Partial<PostItem>) => {
    const updated = await api.updatePost(id, updates);
    await refreshData();
    if (selectedPost && selectedPost.id === id) {
      setSelectedPost(updated);
    }
    return updated;
  };

  const approvePost = async (id: string, isApproved: boolean = true) => {
    const updated = await api.approvePost(id, isApproved);
    await refreshData();
    if (selectedPost && selectedPost.id === id && updated) {
      setSelectedPost(updated);
    }
    return updated;
  };

  const deletePost = async (id: string) => {
    const success = await api.deletePost(id);
    await refreshData();
    if (selectedPost && selectedPost.id === id) {
      setSelectedPost(null);
    }
    return success;
  };

  const toggleFavorite = async (postId: string, note?: string) => {
    if (api.isFavorite(postId)) {
      await api.removeFavorite(postId);
    } else {
      await api.addFavorite(postId, note);
    }
    await refreshData();
    return api.isFavorite(postId);
  };

  const updateFavoriteNote = async (favId: string, note: string) => {
    await api.updateFavoriteNote(favId, note);
    await refreshData();
  };

  const isFavorite = (postId: string) => {
    return api.isFavorite(postId);
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    await api.markNotificationAsRead(id);
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await api.markAllNotificationsAsRead();
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    await api.clearAllNotifications();
  };

  const login = async (studentId: string, password?: string) => {
    const loggedIn = await api.login(studentId, password);
    setUser(loggedIn);
    await refreshData();
  };

  const register = async (studentId: string, email?: string, password?: string, fullName?: string, phone?: string) => {
    const registered = await api.register(studentId, email, password, fullName, phone);
    setUser(registered);
    await refreshData();
  };

  const updateProfile = async (data: Partial<User>) => {
    const updated = await api.updateUserProfile(data);
    setUser(updated);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  // คำนวณจำนวนแจ้งเตือนของหาย/พบของที่ยังไม่ได้อ่าน
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  // คำนวณจำนวนห้องแชทที่มีข้อความใหม่ที่ยังไม่ได้อ่าน
  const unreadChatCount = conversations.reduce((sum, c) => sum + (c.unreadCount > 0 ? 1 : 0), 0);

  return (
    <AppContext.Provider
      value={{
        user,
        posts,
        favorites,
        notifications,
        conversations,
        unreadNotifsCount,
        unreadChatCount,
        isLoading,
        selectedPost,
        setSelectedPost,
        activeInAppBanner,
        dismissInAppBanner,
        triggerNotificationAlert,
        refreshData,
        refreshConversations,
        markChatAsRead,
        toggleLikeMessage,
        createPost,
        updatePost,
        approvePost,
        deletePost,
        toggleFavorite,
        updateFavoriteNote,
        isFavorite,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
