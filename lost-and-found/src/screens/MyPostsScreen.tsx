import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { PostItem, ItemStatus } from '../types';

/**
 * =========================================================================
 * 📋 หน้าโพสต์ของฉัน (My Posts Screen - ตามแบบ โพสต์ของฉัน.png, 1.png, 2.png)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * แสดงรายการโพสต์ทั้งหมดของผู้ใช้งาน พร้อมปุ่มกรอง 3 แท็บ: ของหาย, ของที่พบ, ส่งคืนแล้ว
 * และป้ายสถานะสีแดง 'ยังไม่พบ' หรือสีเขียว 'ส่งคืนแล้ว'
 * =========================================================================
 */

interface MyPostsScreenProps {
  onBack: () => void;
  onSelectPost: (post: PostItem) => void;
}

export const MyPostsScreen: React.FC<MyPostsScreenProps> = ({ onBack, onSelectPost }) => {
  const { posts, user, updatePost, deletePost } = useApp();
  const { colors, isDark } = useTheme();

  const [selectedFilter, setSelectedFilter] = useState<'lost' | 'found' | 'returned'>('lost');

  // ดึงเฉพาะโพสต์ของตัวเอง
  const myPosts = posts.filter(
    (p) => p.userId === user?.id || p.userEmail === user?.email
  );

  // กรองตามแท็บที่เลือก
  const filteredPosts = myPosts.filter((p) => {
    if (selectedFilter === 'lost') return p.type === 'lost' && p.status !== 'returned';
    if (selectedFilter === 'found') return p.type === 'found' && p.status !== 'returned';
    if (selectedFilter === 'returned') return p.status === 'returned';
    return true;
  });

  const handleQuickStatus = (post: PostItem) => {
    Alert.alert(
      'จัดการโพสต์',
      `เลือกการดำเนินการสำหรับ: "${post.title}"`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: post.status === 'returned' ? 'เปลี่ยนเป็น "ยังไม่พบ"' : 'เปลี่ยนเป็น "ส่งคืนแล้ว" ✅',
          onPress: async () => {
            await updatePost(post.id, {
              status: post.status === 'returned' ? (post.type === 'lost' ? 'lost' : 'found') : 'returned',
            });
          },
        },
        {
          text: 'ลบโพสต์ 🗑️',
          style: 'destructive',
          onPress: () => {
            Alert.alert('ยืนยันการลบ', 'คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?', [
              { text: 'ยกเลิก', style: 'cancel' },
              {
                text: 'ลบ',
                style: 'destructive',
                onPress: async () => {
                  await deletePost(post.id);
                },
              },
            ]);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.blackCircleBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>โพสต์ของฉัน</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 3 Filter Pills */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterPill,
            selectedFilter === 'lost'
              ? [styles.filterPillActive, { backgroundColor: colors.primary }]
              : { backgroundColor: isDark ? colors.surfaceAlt : '#E2E8F0' },
          ]}
          onPress={() => setSelectedFilter('lost')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterPillText,
              selectedFilter === 'lost' ? styles.filterPillTextActive : { color: colors.text },
            ]}
          >
            ของหาย
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterPill,
            selectedFilter === 'found'
              ? [styles.filterPillActive, { backgroundColor: colors.primary }]
              : { backgroundColor: isDark ? colors.surfaceAlt : '#E2E8F0' },
          ]}
          onPress={() => setSelectedFilter('found')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterPillText,
              selectedFilter === 'found' ? styles.filterPillTextActive : { color: colors.text },
            ]}
          >
            ของที่พบ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterPill,
            selectedFilter === 'returned'
              ? [styles.filterPillActive, { backgroundColor: colors.primary }]
              : { backgroundColor: isDark ? colors.surfaceAlt : '#E2E8F0' },
          ]}
          onPress={() => setSelectedFilter('returned')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterPillText,
              selectedFilter === 'returned' ? styles.filterPillTextActive : { color: colors.text },
            ]}
          >
            ส่งคืนแล้ว
          </Text>
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="documents-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              ไม่มีรายการในหมวดนี้
            </Text>
          </View>
        ) : (
          filteredPosts.map((post) => {
            const isReturned = post.status === 'returned';
            return (
              <TouchableOpacity
                key={post.id}
                style={[
                  styles.postCard,
                  { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadowColor },
                ]}
                onPress={() => onSelectPost(post)}
                onLongPress={() => handleQuickStatus(post)}
                activeOpacity={0.88}
              >
                {/* Thumbnail */}
                <View style={[styles.thumbnailBox, { backgroundColor: isDark ? colors.surfaceAlt : '#E2E8F0' }]}>
                  {post.imageUrl ? (
                    <Image source={{ uri: post.imageUrl }} style={styles.thumbnailImg} resizeMode="cover" />
                  ) : (
                    <Ionicons name="cube-outline" size={32} color={colors.textMuted} />
                  )}
                </View>

                {/* Details */}
                <View style={styles.cardDetails}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                    {post.title}
                  </Text>
                  <Text style={[styles.cardLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                    {post.location}
                  </Text>
                  <Text style={[styles.cardTime, { color: colors.textMuted }]}>
                    {post.dateTime || 'เมื่อสักครู่'}
                  </Text>
                </View>

                {/* Status Badge */}
                <TouchableOpacity
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isReturned ? '#10B981' : '#EF4444' },
                  ]}
                  onPress={() => handleQuickStatus(post)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.statusBadgeText}>
                    {isReturned ? 'ส่งคืนแล้ว' : 'ยังไม่พบ'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blackCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 18,
    marginTop: 6,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {},
  filterPillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 14,
  },
  postCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  thumbnailBox: {
    width: 70,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 14,
    paddingRight: 60,
    justifyContent: 'center',
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardLocation: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardTime: {
    fontSize: 11,
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
});
