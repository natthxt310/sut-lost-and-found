import { persistentDb } from './db';
import { PostItem, User, FavoriteItem, MatchNotification, MonthlyStats } from '../types';

/**
 * Backend Data Store Wrapper delegating to PersistentDatabase (Real Disk Storage)
 */
class BackendDataStore {
  getUsers(): User[] {
    return persistentDb.getUsers();
  }

  getUserById(id: string): User | undefined {
    return persistentDb.getUserById(id);
  }

  getUserByStudentId(studentId: string): User | undefined {
    return persistentDb.getUserByStudentId(studentId);
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    return persistentDb.createUser(user);
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    return persistentDb.updateUser(id, updates);
  }

  deleteUser(id: string): boolean {
    return persistentDb.deleteUser(id);
  }

  getPosts(filter?: {
    type?: 'lost' | 'found';
    category?: string;
    location?: string;
    search?: string;
    all?: boolean;
    userId?: string;
  }): PostItem[] {
    return persistentDb.getPosts(filter);
  }

  getPostById(id: string): PostItem | undefined {
    return persistentDb.getPostById(id);
  }

  createPost(post: Omit<PostItem, 'id' | 'createdAt'>): PostItem {
    return persistentDb.createPost(post);
  }

  approvePost(id: string, isApproved: boolean = true): PostItem | undefined {
    return persistentDb.approvePost(id, isApproved);
  }

  updatePost(id: string, updates: Partial<PostItem>): PostItem | undefined {
    return persistentDb.updatePost(id, updates);
  }

  deletePost(id: string): boolean {
    return persistentDb.deletePost(id);
  }

  getFavorites(userId?: string): FavoriteItem[] {
    return persistentDb.getFavorites(userId);
  }

  addFavorite(userId: string, postId: string, personalNote?: string): FavoriteItem {
    return persistentDb.addFavorite(userId, postId, personalNote);
  }

  updateFavoriteNote(id: string, personalNote: string): FavoriteItem | undefined {
    return persistentDb.updateFavoriteNote(id, personalNote);
  }

  deleteFavorite(id: string): boolean {
    return persistentDb.deleteFavorite(id);
  }

  getNotifications(): MatchNotification[] {
    return persistentDb.getNotifications();
  }

  saveNotifications(notifs: MatchNotification[]): void {
    persistentDb.saveNotifications(notifs);
  }

  markNotificationAsRead(id: string): void {
    persistentDb.markNotificationAsRead(id);
  }

  getMessages(postId?: string, userA?: string, userB?: string) {
    return persistentDb.getMessages(postId, userA, userB);
  }

  sendMessage(msg: any) {
    return persistentDb.sendMessage(msg);
  }

  getStats(): MonthlyStats {
    return persistentDb.getStats();
  }

  getQuarterlyStats(quarter?: number, year?: number) {
    return persistentDb.getQuarterlyStats(quarter, year);
  }
}

export const backendStore = new BackendDataStore();
