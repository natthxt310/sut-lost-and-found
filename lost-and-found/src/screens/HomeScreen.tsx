import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useShakeSensor } from '../hooks/useShakeSensor';
import { PostItem, PostType } from '../types';

const { width } = Dimensions.get('window');

/**
 * =========================================================================
 * 🏠 หน้าหลัก (Home Screen - สะอาด สวยงาม โลโก้ชัดเจน)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. แถบสีส้มด้านบนแสดงโลโก้ SUT LOST & FOUND และชื่อผู้ใช้คลีนๆ
 * 2. 2 ปุ่มใหญ่: แจ้งของหาย (สีแดง) และ แจ้งพบของ (สีเขียว)
 * 3. ฟีดโพสต์ล่าสุดทั้งหมด พร้อมระบบเขย่าเพื่อรีเฟรช (Shake Sensor)
 * =========================================================================
 */

interface HomeScreenProps {
  onSelectPost: (post: PostItem) => void;
  onNavigateToCreate: (type: PostType) => void;
  onNavigateToSearch: (category?: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectPost,
  onNavigateToCreate,
  onNavigateToSearch,
}) => {
  const { posts, user, isLoading, refreshData } = useApp();
  const { colors, isDark } = useTheme();

  // State สำหรับแจ้งเตือนการเขย่าเครื่อง (Shake Sensor)
  const [showShakeBanner, setShowShakeBanner] = useState(false);

  // 📳 Accelerometer Shake Sensor (Hardware Sensor)
  useShakeSensor(async () => {
    setShowShakeBanner(true);
    await refreshData();
    setTimeout(() => {
      setShowShakeBanner(false);
    }, 3500);
  });

  // รายการโพสต์ทั้งหมด
  const latestPosts = posts;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. SUT Header (Orange in Light Mode, Dark in Dark Mode) */}
      <View
        style={[
          styles.orangeHeader,
          {
            backgroundColor: isDark ? colors.surface : colors.primary,
            borderBottomColor: isDark ? colors.primaryBorder : 'transparent',
            borderBottomWidth: isDark ? 1 : 0,
          },
        ]}
      >
        <View style={styles.headerContentRow}>
          {/* SUT Lost & Found Brand Logo Badge */}
          <View
            style={[
              styles.brandBadge,
              { backgroundColor: isDark ? colors.surfaceAlt : '#FFFFFF', borderColor: isDark ? colors.border : 'transparent', borderWidth: isDark ? 1 : 0 },
            ]}
          >
            <View style={[styles.brandLogoCircle, { backgroundColor: isDark ? 'rgba(255,122,0,0.2)' : '#FFF7ED' }]}>
              <Ionicons name="search" size={15} color="#FF7A00" />
            </View>
            <Text style={[styles.brandLogoText, { color: isDark ? colors.text : '#0F172A' }]}>
              LOST & FOUND
            </Text>
            <View style={styles.sutPill}>
              <Text style={styles.sutPillText}>มทส.</Text>
            </View>
          </View>

          {/* User Name Badge */}
          <View
            style={[
              styles.userBadge,
              { backgroundColor: isDark ? colors.surfaceAlt : 'rgba(0, 0, 0, 0.25)' },
            ]}
          >
            <Ionicons name="person-circle" size={20} color={isDark ? colors.primary : '#FFFFFF'} />
            <Text style={[styles.userNameText, { color: isDark ? colors.text : '#FFFFFF' }]} numberOfLines={1}>
              {user ? user.fullName : 'นักศึกษา มทส.'}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Scrollable Body */}
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} colors={[colors.primary]} />
        }
      >
        {/* 📳 Shake Sensor Banner */}
        {showShakeBanner && (
          <View style={[styles.shakeBanner, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
            <View style={styles.shakeBannerLeft}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.shakeBannerTitle, { color: colors.primary }]}>
                  ตรวจพบการเขย่าเครื่อง (Shake Sensor) 📳
                </Text>
                <Text style={[styles.shakeBannerSubtitle, { color: colors.textSecondary }]}>
                  รีเฟรชข้อมูลโพสต์ล่าสุดเรียบร้อยแล้ว
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowShakeBanner(false)}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* 2 Large Action Buttons: แจ้งของหาย & แจ้งพบของ */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionLargeBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FFEAEA' }]}
            onPress={() => onNavigateToCreate('lost')}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>แจ้งของหาย</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionLargeBtn, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#E8F8F0' }]}
            onPress={() => onNavigateToCreate('found')}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionBtnText, { color: '#10B981' }]}>แจ้งพบของ</Text>
          </TouchableOpacity>
        </View>

        {/* โพสต์ล่าสุด Header with ดูทั้งหมด link */}
        <View style={styles.feedHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>โพสต์ล่าสุด</Text>
          <TouchableOpacity onPress={() => onNavigateToSearch()} activeOpacity={0.7}>
            <Text style={[styles.viewAllText, { color: colors.actionBlue }]}>ดูทั้งหมด ({posts.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Latest Posts Feed List */}
        <View style={styles.postsList}>
          {latestPosts.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.border }]}>
              <Ionicons name="sparkles-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>ยังไม่มีโพสต์ล่าสุด</Text>
            </View>
          ) : (
            latestPosts.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={[
                  styles.postCard,
                  { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadowColor },
                ]}
                onPress={() => onSelectPost(post)}
                activeOpacity={0.88}
              >
                {/* Image Thumbnail */}
                <View style={[styles.postThumbnailBox, { backgroundColor: isDark ? colors.surfaceAlt : '#E2E8F0' }]}>
                  {post.imageUrl ? (
                    <Image source={{ uri: post.imageUrl }} style={styles.postThumbnail} resizeMode="cover" />
                  ) : (
                    <Ionicons name="cube-outline" size={28} color={colors.textMuted} />
                  )}
                </View>

                {/* Details */}
                <View style={styles.postDetails}>
                  <View style={styles.postTitleRow}>
                    <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={1}>
                      {post.title}
                    </Text>
                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadgeMini,
                        {
                          backgroundColor:
                            post.status === 'returned'
                              ? '#10B981'
                              : post.type === 'lost'
                              ? '#EF4444'
                              : '#10B981',
                        },
                      ]}
                    >
                      <Text style={styles.statusBadgeTextMini}>
                        {post.status === 'returned'
                          ? 'ส่งคืนแล้ว'
                          : post.type === 'lost'
                          ? 'ของหาย'
                          : 'พบของ'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.postLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                    {post.location}
                  </Text>
                  <Text style={[styles.postTime, { color: colors.textMuted }]}>
                    {post.dateTime || 'เมื่อสักครู่'}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orangeHeader: {
    paddingTop: 54,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  brandLogoCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogoText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sutPill: {
    backgroundColor: '#FF7A00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sutPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    maxWidth: '48%',
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  shakeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  shakeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  shakeBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  shakeBannerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  actionLargeBtn: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  postsList: {
    gap: 12,
  },
  postCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  postThumbnailBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postThumbnail: {
    width: '100%',
    height: '100%',
  },
  postDetails: {
    flex: 1,
    marginLeft: 14,
    gap: 3,
  },
  postTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 6,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  statusBadgeMini: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  statusBadgeTextMini: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  postLocation: {
    fontSize: 12,
  },
  postTime: {
    fontSize: 11,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
