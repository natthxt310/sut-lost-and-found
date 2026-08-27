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
import { SUTDropdown } from '../components/SUTDropdown';
import { PostItem, PostType, SUT_LOCATIONS, ITEM_CATEGORIES } from '../types';

/**
 * =========================================================================
 * 🔍 หน้าค้นหาและกระดานประกาศรวม (Explore & Search Board Screen)
 * =========================================================================
 * 💡 อธิบายการทำงานแบบเข้าใจง่าย:
 * รวมหน้า "ของหาย (Lost)" และ "พบของ (Found)" เข้ามาอยู่ในหน้าเดียวกัน
 * 
 * 📌 ฟังก์ชันหลัก:
 * 1. ปุ่มสลับแท็บประเภท: [ทั้งหมด] | [ของหาย 🔴] | [พบของ 🟢]
 * 2. ช่องค้นหาข้อความ (Search Bar): พิมพ์ชื่อ, สี, หรือรายละเอียด
 * 3. ตัวกรองหมวดหมู่และสถานที่ใน มทส.
 * 4. แสดงการ์ดรายการสิ่งของ พร้อมปุ่มแตะดูรายละเอียด และ Pull-to-refresh
 * =========================================================================
 */

interface ExploreBoardScreenProps {
  onSelectPost: (post: PostItem) => void;
  onNavigateToCreate: (type: PostType) => void;
}

type FilterType = 'all' | 'lost' | 'found';

export const ExploreBoardScreen: React.FC<ExploreBoardScreenProps> = ({
  onSelectPost,
  onNavigateToCreate,
}) => {
  const { posts, refreshData, isLoading } = useApp();
  const { colors, isDark } = useTheme();

  const [activeType, setActiveType] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedLocation, setSelectedLocation] = useState('ทั้งหมด');

  const categories = ['ทั้งหมด', ...ITEM_CATEGORIES];
  const locations = ['ทั้งหมด', ...SUT_LOCATIONS];

  // 🔍 กรองข้อมูลตามเงื่อนไขทั้งหมด (ประเภท + คำค้นหา + หมวดหมู่ + สถานที่)
  const filteredPosts = posts.filter((post) => {
    // 1. กรองประเภท (ทั้งหมด / ของหาย / พบของ)
    if (activeType === 'lost' && post.type !== 'lost') return false;
    if (activeType === 'found' && post.type !== 'found') return false;

    // 2. กรองหมวดหมู่
    if (selectedCategory !== 'ทั้งหมด' && !post.category.includes(selectedCategory)) {
      return false;
    }

    // 3. กรองสถานที่
    if (selectedLocation !== 'ทั้งหมด' && post.location !== selectedLocation) {
      return false;
    }

    // 4. กรองคำค้นหา
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchDesc = post.description.toLowerCase().includes(q);
      const matchLoc = post.location.toLowerCase().includes(q);
      const matchCat = post.category.toLowerCase().includes(q);
      const matchColor = post.color.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchCat && !matchColor) {
        return false;
      }
    }

    return true;
  });

  const lostCount = posts.filter((p) => p.type === 'lost' && p.status === 'lost').length;
  const foundCount = posts.filter((p) => p.type === 'found' && p.status !== 'returned').length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} colors={[colors.primary]} />
        }
      >
        {/* Header Title Section */}
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.mainTitle, { color: colors.text }]}>ค้นหาและกระดานประกาศ</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                รวมรายการของหายและของที่พบทั้งหมดใน มทส.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.createQuickBtn, { backgroundColor: colors.primary }]}
              onPress={() => onNavigateToCreate(activeType === 'found' ? 'found' : 'lost')}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.createQuickBtnText}>โพสต์</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🔘 Segmented Type Filter Tabs */}
        <View style={[styles.segmentedContainer, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeType === 'all' && [styles.segmentBtnActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setActiveType('all')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="grid"
              size={15}
              color={activeType === 'all' ? '#FFFFFF' : colors.textSecondary}
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeType === 'all' ? '#FFFFFF' : colors.textSecondary },
                activeType === 'all' && styles.segmentTextActive,
              ]}
            >
              ทั้งหมด ({posts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeType === 'lost' && [styles.segmentBtnActive, { backgroundColor: colors.danger }],
            ]}
            onPress={() => setActiveType('lost')}
            activeOpacity={0.8}
          >
            <View style={[styles.badgeDot, { backgroundColor: colors.danger }]} />
            <Text
              style={[
                styles.segmentText,
                { color: activeType === 'lost' ? '#FFFFFF' : colors.textSecondary },
                activeType === 'lost' && styles.segmentTextActive,
              ]}
            >
              ของหาย ({lostCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeType === 'found' && [styles.segmentBtnActive, { backgroundColor: colors.success }],
            ]}
            onPress={() => setActiveType('found')}
            activeOpacity={0.8}
          >
            <View style={[styles.badgeDot, { backgroundColor: colors.success }]} />
            <Text
              style={[
                styles.segmentText,
                { color: activeType === 'found' ? '#FFFFFF' : colors.textSecondary },
                activeType === 'found' && styles.segmentTextActive,
              ]}
            >
              พบของ ({foundCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="ค้นหาชื่อสิ่งของ, สี, อาคาร หรือจุดที่พบ..."
          />
        </View>

        {/* Dropdown Filters */}
        <View style={styles.dropdownsRow}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <SUTDropdown
              label="หมวดหมู่"
              items={categories}
              selectedValue={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <SUTDropdown
              label="สถานที่ใน มทส."
              items={locations}
              selectedValue={selectedLocation}
              onSelect={setSelectedLocation}
            />
          </View>
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScrollView}
          contentContainerStyle={styles.chipContainer}
        >
          {categories.slice(0, 7).map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  { backgroundColor: colors.surface, borderColor: colors.borderLight },
                  isSelected && [styles.chipActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: colors.textSecondary },
                    isSelected && styles.chipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Results Count & Reset Filter */}
        <View style={styles.resultsInfoRow}>
          <Text style={[styles.resultsCountText, { color: colors.textSecondary }]}>
            พบทั้งหมด <Text style={{ fontWeight: '700', color: colors.primary }}>{filteredPosts.length}</Text> รายการ
          </Text>
          {(search !== '' || selectedCategory !== 'ทั้งหมด' || selectedLocation !== 'ทั้งหมด' || activeType !== 'all') && (
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                setSelectedCategory('ทั้งหมด');
                setSelectedLocation('ทั้งหมด');
                setActiveType('all');
              }}
              style={styles.resetFilterBtn}
            >
              <Ionicons name="refresh" size={13} color={colors.primary} style={{ marginRight: 3 }} />
              <Text style={[styles.resetFilterText, { color: colors.primary }]}>ล้างตัวกรอง</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Post Items List */}
        <View style={styles.itemsList}>
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <ItemCard
                key={post.id}
                item={post}
                onPress={() => onSelectPost(post)}
              />
            ))
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryBg }]}>
                <Ionicons name="search-outline" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>ไม่พบรายการที่ค้นหา</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองหมวดหมู่อื่นดูนะครับ
              </Text>
              <TouchableOpacity
                style={[styles.resetAllBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setSearch('');
                  setSelectedCategory('ทั้งหมด');
                  setSelectedLocation('ทั้งหมด');
                  setActiveType('all');
                }}
              >
                <Text style={styles.resetAllBtnText}>แสดงรายการทั้งหมด</Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerSection: {
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  createQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    elevation: 2,
  },
  createQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 3,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  segmentBtnActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    fontWeight: '800',
  },
  searchWrapper: {
    marginBottom: 10,
  },
  dropdownsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chipScrollView: {
    marginBottom: 14,
  },
  chipContainer: {
    paddingRight: 10,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
  },
  chipActive: {
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  resultsCountText: {
    fontSize: 12,
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemsList: {
    gap: 12,
  },
  emptyContainer: {
    padding: 30,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  resetAllBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  resetAllBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
