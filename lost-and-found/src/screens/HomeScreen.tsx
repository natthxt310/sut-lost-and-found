import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ItemCard } from '../components/ItemCard';
import { SearchBar } from '../components/SearchBar';
import { PostItem } from '../types';

// =========================================================================
// 🏠 หน้าหลัก (Home Screen)
// =========================================================================
// 💡 อธิบายการทำงานแบบเข้าใจง่าย:
// หน้านี้คือ "ศูนย์รวมประกาศทั้งหมด" ของแอป SUT Lost & Found
// 
// 📌 มีฟังก์ชันหลัก 4 อย่าง:
// 1. สรุปสถิติยอดรวม (ของหายกี่ชิ้น / เจอแล้วกี่ชิ้น / ส่งคืนแล้วกี่ชิ้น)
// 2. ปุ่มด่วน 2 ปุ่ม: "ฉันทำของหาย" และ "ฉันพบสิ่งของ" (กดเพื่อไปหน้าโพสต์)
// 3. ช่องค้นหา (Search) และปุ่มกรองหมวดหมู่ (Category Filter)
// 4. แสดงรายการโพสต์ทั้งหมด พร้อมระบบดึงหน้าจอลงเพื่อรีเฟรช (Pull to Refresh)
// =========================================================================

interface HomeScreenProps {
  onSelectPost: (post: PostItem) => void;
  onNavigateToCreate: (type: 'lost' | 'found') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectPost,
  onNavigateToCreate,
}) => {
  // ดึงข้อมูลโพสต์และผู้ใช้จาก Global State
  const { posts, refreshData, isLoading, user } = useApp();
  const { colors, isDark } = useTheme();
  
  // ตัวแปรสำหรับค้นหาและกรองหมวดหมู่
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');

  // หมวดหมู่สิ่งของทั้งหมดที่ให้เลือกกดกรอง
  const categories = [
    'ทั้งหมด',
    'กุญแจรถ / พวงกุญแจ',
    'เอกสาร / บัตรนักศึกษา',
    'อุปกรณ์อิเล็กทรอนิกส์',
    'หูฟัง / AirPods',
    'แท็บเล็ต / iPad',
    'กระเป๋า / กระเป๋าสตางค์',
  ];

  // 🔍 ระบบกรองโพสต์: กรองตามหมวดหมู่ที่เลือก + คำค้นหาที่พิมพ์ในช่อง Search
  const filteredPosts = posts.filter((post) => {
    const matchCategory =
      selectedCategory === 'ทั้งหมด' || post.category.includes(selectedCategory);
    const matchSearch =
      !search ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.location.toLowerCase().includes(search.toLowerCase()) ||
      post.description.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  // 📊 คำนวณตัวเลขอัตโนมัติ: นับจำนวนของหาย / ของที่พบ / ของที่ส่งคืนแล้ว
  const lostCount = posts.filter((p) => p.type === 'lost' && p.status === 'lost').length;
  const foundCount = posts.filter((p) => p.type === 'found' && p.status !== 'returned').length;
  const returnedCount = posts.filter((p) => p.status === 'returned').length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} colors={[colors.primary]} />
        }
      >
        {/* Minimalist Hero Section */}
        <View style={[styles.heroCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, shadowColor: colors.shadowColor }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
                สวัสดี, {user ? user.fullName : 'นักศึกษา มทส.'} 👋
              </Text>
              <Text style={[styles.heroTitle, { color: colors.text }]}>คุณทำของหาย หรือพบของ?</Text>
            </View>
            <View style={[styles.shieldBadge, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            </View>
          </View>

          {/* Quick Stats Pills */}
          <View style={styles.statsRow}>
            <View style={[styles.statPill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <View style={[styles.statDot, { backgroundColor: colors.danger }]} />
              <Text style={[styles.statPillText, { color: colors.textSecondary }]}>ของหาย {lostCount}</Text>
            </View>

            <View style={[styles.statPill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <View style={[styles.statDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statPillText, { color: colors.textSecondary }]}>พบของ {foundCount}</Text>
            </View>

            <View style={[styles.statPill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <View style={[styles.statDot, { backgroundColor: colors.info }]} />
              <Text style={[styles.statPillText, { color: colors.textSecondary }]}>ส่งคืนแล้ว {returnedCount}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons: 2 Large Modern Cards */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, styles.lostCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, shadowColor: colors.shadowColor }]}
            onPress={() => onNavigateToCreate('lost')}
            activeOpacity={0.88}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
              <Ionicons name="search" size={22} color={colors.danger} />
            </View>
            <Text style={[styles.actionCardTitle, { color: colors.text }]}>ฉันทำของหาย</Text>
            <Text style={[styles.actionCardSub, { color: colors.textSecondary }]}>โพสต์ตามหาของ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.foundCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, shadowColor: colors.shadowColor }]}
            onPress={() => onNavigateToCreate('found')}
            activeOpacity={0.88}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
              <Ionicons name="camera" size={22} color={colors.success} />
            </View>
            <Text style={[styles.actionCardTitle, { color: colors.text }]}>ฉันพบสิ่งของ</Text>
            <Text style={[styles.actionCardSub, { color: colors.textSecondary }]}>แจ้งส่งคืนเจ้าของ</Text>
          </TouchableOpacity>
        </View>

        {/* Modern Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="ค้นหาชื่อสิ่งของ, สถานที่ (เช่น B1, หอสมุด)..."
          />
        </View>

        {/* Minimalist Filter Chips */}
        <View style={styles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat, idx) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: colors.cardBg, borderColor: colors.border },
                    active && { backgroundColor: isDark ? colors.primary : '#0F172A', borderColor: isDark ? colors.primary : '#0F172A' },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: colors.textSecondary },
                      active && { color: '#FFFFFF', fontWeight: '700' },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Feed Header */}
        <View style={styles.feedHeader}>
          <Text style={[styles.feedTitle, { color: colors.text }]}>รายการล่าสุดใน มทส.</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
            <Text style={[styles.countBadgeText, { color: colors.primary }]}>{filteredPosts.length} รายการ</Text>
          </View>
        </View>

        {/* Feed Posts List */}
        {filteredPosts.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>ไม่พบรายการที่ค้นหา</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูครับ</Text>
          </View>
        ) : (
          filteredPosts.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onPress={() => onSelectPost(item)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  shieldBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  lostCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  foundCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  actionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  actionCardSub: {
    fontSize: 11,
  },
  searchSection: {
    marginBottom: 12,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryScroll: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipActive: {},
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipTextActive: {},
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 12,
  },
});
