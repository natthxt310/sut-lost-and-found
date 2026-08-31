import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { PostItem } from '../types';
import { useShakeSensor } from '../hooks/useShakeSensor';

const { width } = Dimensions.get('window');

/**
 * =========================================================================
 * 🏠 หน้าหลัก (Home Screen - ตามแบบ หน้าหลัก.png)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. ส่วนหัวสีส้ม SUT Orange Gradient พร้อมนาฬิกาดิจิทัล Widget (08:00) และช่องค้นหา
 * 2. 2 ปุ่มใหญ่: "แจ้งของหาย" (สีชมพูอ่อน) & "แจ้งพบของ" (สีเขียวอ่อน)
 * 3. กริด 8 หมวดหมู่ (โทรศัพท์, กระเป๋า, บัตร, กุญแจ, หูฟัง, นาฬิกา, เสื้อผ้า, อื่นๆ)
 * 4. รายการโพสต์ล่าสุด พร้อมปุ่ม "ดูทั้งหมด"
 * =========================================================================
 */

interface HomeScreenProps {
  onSelectPost: (post: PostItem) => void;
  onNavigateToCreate: (type: 'lost' | 'found') => void;
  onNavigateToSearch: (category?: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectPost,
  onNavigateToCreate,
  onNavigateToSearch,
}) => {
  const { posts, refreshData, isLoading, user } = useApp();
  const { colors, isDark } = useTheme();

  const [search, setSearch] = useState('');
  const [showShakeBanner, setShowShakeBanner] = useState(false);
  const [currentTime, setCurrentTime] = useState('08:00');
  const [greeting, setGreeting] = useState('สวัสดีตอนเช้า');

  // นาฬิกาดิจิทัลและคำทักทายตามเวลาจริง
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);

      const h = now.getHours();
      if (h >= 5 && h < 12) setGreeting('สวัสดีตอนเช้า');
      else if (h >= 12 && h < 17) setGreeting('สวัสดีตอนบ่าย');
      else if (h >= 17 && h < 21) setGreeting('สวัสดีตอนเย็น');
      else setGreeting('สวัสดีตอนดึก');
    };

    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  // 📳 Accelerometer Shake Sensor
  useShakeSensor(async () => {
    setShowShakeBanner(true);
    await refreshData();
    setTimeout(() => {
      setShowShakeBanner(false);
    }, 3500);
  });

  // 8 หมวดหมู่ตามแบบ Mockup ที่เชื่อมโยงกับระบบแท็กละเอียด
  const categoryGrid = [
    { id: 'phone', name: 'โทรศัพท์ & แท็บเล็ต', icon: 'phone-portrait' },
    { id: 'bag', name: 'กระเป๋าเป้ & ถุงผ้า', icon: 'bag' },
    { id: 'card', name: 'บัตรนักศึกษา & บัตร', icon: 'card' },
    { id: 'key', name: 'กุญแจรถ & กุญแจ', icon: 'key' },
    { id: 'headset', name: 'หูฟัง & AirPods', icon: 'headset' },
    { id: 'it', name: 'โน้ตบุ๊ก & IT', icon: 'laptop-outline' },
    { id: 'shirt', name: 'เสื้อผ้า & เสื้อช็อป', icon: 'shirt' },
    { id: 'other', name: 'อื่นๆ', icon: 'ellipsis-horizontal' },
  ];

  // โพสต์ 5 รายการล่าสุด
  const latestPosts = posts.slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. SUT Orange Gradient Header */}
      <View style={[styles.orangeHeader, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.userNameText} numberOfLines={1}>
              {user ? user.fullName : 'ชื่อผู้ใช้'}
            </Text>
          </View>

          {/* Digital Clock Widget */}
          <View style={styles.digitalClockWidget}>
            <Text style={styles.clockDigitalText}>{currentTime}</Text>
          </View>
        </View>

        {/* Search Input Bar */}
        <TouchableOpacity
          style={styles.searchBarBox}
          onPress={() => onNavigateToSearch(search)}
          activeOpacity={0.9}
        >
          <Ionicons name="search" size={18} color="#94A3B8" />
          <Text style={styles.searchPlaceholder}>
            {search ? search : 'ค้นหา'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. White Scrollable Body */}
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

        {/* หมวดหมู่ (Categories Header) */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>หมวดหมู่</Text>

        {/* 2x4 Categories Grid */}
        <View style={styles.categoryGrid}>
          {categoryGrid.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => onNavigateToSearch(cat.name)}
              activeOpacity={0.75}
            >
              <View style={[styles.categorySquare, { backgroundColor: isDark ? colors.surfaceAlt : '#E2E8F0' }]}>
                <Ionicons name={cat.icon as any} size={28} color={colors.text} />
              </View>
              <Text style={[styles.categoryLabel, { color: colors.text }]} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* โพสต์ล่าสุด Header with ดูทั้งหมด link */}
        <View style={styles.feedHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>โพสต์ล่าสุด</Text>
          <TouchableOpacity onPress={() => onNavigateToSearch()} activeOpacity={0.7}>
            <Text style={[styles.viewAllText, { color: colors.actionBlue }]}>ดูทั้งหมด</Text>
          </TouchableOpacity>
        </View>

        {/* Latest Posts List */}
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
                {/* Thumbnail */}
                <View style={[styles.postThumbnailBox, { backgroundColor: isDark ? colors.surfaceAlt : '#E2E8F0' }]}>
                  {post.imageUrl ? (
                    <Image source={{ uri: post.imageUrl }} style={styles.postThumbnail} resizeMode="cover" />
                  ) : (
                    <Ionicons name="cube-outline" size={28} color={colors.textMuted} />
                  )}
                </View>

                {/* Details */}
                <View style={styles.postCardContent}>
                  <Text style={[styles.postCardTitle, { color: colors.text }]} numberOfLines={1}>
                    {post.title}
                  </Text>
                  <Text style={[styles.postCardLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                    {post.location}
                  </Text>
                  <Text style={[styles.postCardTime, { color: colors.textMuted }]}>
                    {post.dateTime || 'เมื่อสักครู่'}
                  </Text>
                </View>

                {/* Chevron > */}
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
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  digitalClockWidget: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  clockDigitalText: {
    color: '#FF7A00',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontVariant: ['tabular-nums'],
  },
  searchBarBox: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 8,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  searchPlaceholder: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
    marginBottom: 24,
  },
  actionLargeBtn: {
    flex: 1,
    paddingVertical: 22,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryItem: {
    width: (width - 40 - 36) / 4,
    alignItems: 'center',
    marginBottom: 14,
  },
  categorySquare: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewAllText: {
    fontSize: 14,
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  postThumbnailBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postThumbnail: {
    width: '100%',
    height: '100%',
  },
  postCardContent: {
    flex: 1,
    marginLeft: 14,
    gap: 3,
  },
  postCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  postCardLocation: {
    fontSize: 12,
    fontWeight: '500',
  },
  postCardTime: {
    fontSize: 11,
  },
  emptyBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
