import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { PostItem } from '../types';

const { width } = Dimensions.get('window');

/**
 * =========================================================================
 * 🔍 หน้าค้นหา & แผนที่ มทส. (Search & Explore Screen - ตามแบบ หน้าหลัก-1.png และ ค้นหา.png)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. โหมดค้นหา & ตัวกรอง (Search + Filters): ค้นหาสถานที่, หมวดหมู่, ช่วงเวลา
 * 2. โหมดแผนที่ มทส. (Campus Map): แสดงอาคาร มทส. พร้อมระยะทาง "ใกล้คุณ"
 * =========================================================================
 */

interface ExploreBoardScreenProps {
  onSelectPost: (post: PostItem) => void;
  initialCategory?: string;
}

export const ExploreBoardScreen: React.FC<ExploreBoardScreenProps> = ({
  onSelectPost,
  initialCategory,
}) => {
  const { posts } = useApp();
  const { colors, isDark } = useTheme();

  // สถานะการค้นหาและฟิลเตอร์
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory || '');
  const [timeFilter, setTimeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'filter' | 'map'>('filter');

  // รายการสถานที่ใน มทส.
  const sutLocations = [
    'อาคารเรียนรวม 1 (B1)',
    'อาคารเรียนรวม 2 (B2)',
    'ศูนย์บรรณสารและสื่อการศึกษา (หอสมุด)',
    'โรงอาหารสุรนิเวศน์ (กาสะลอง)',
    'อาคารบริหาร มทส.',
    'U-Store / Fresh Me',
  ];

  // กรองผลการค้นหา
  const searchResults = posts.filter((post) => {
    const matchSearch =
      !search ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.description.toLowerCase().includes(search.toLowerCase());

    const matchLocation =
      !locationFilter || post.location.toLowerCase().includes(locationFilter.toLowerCase());

    const matchCategory =
      !categoryFilter || post.category.toLowerCase().includes(categoryFilter.toLowerCase());

    return matchSearch && matchLocation && matchCategory;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Search Header Bar */}
      <View style={styles.topHeader}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="ค้นหา"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Toggle Mode Button (Filter vs Map) */}
        <TouchableOpacity
          style={[
            styles.filterToggleBtn,
            viewMode === 'map' ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => setViewMode(viewMode === 'filter' ? 'map' : 'filter')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={viewMode === 'filter' ? 'filter-outline' : 'list-outline'}
            size={22}
            color={viewMode === 'map' ? '#FFFFFF' : colors.text}
          />
        </TouchableOpacity>
      </View>

      {viewMode === 'filter' ? (
        /* ================= MODE 1: FILTER & SEARCH RESULTS (หน้าหลัก-1.png) ================= */
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ตัวกรอง Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ตัวกรอง</Text>

          <View style={styles.filterForm}>
            {/* 1. Location Input */}
            <View style={[styles.filterInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="location" size={18} color={colors.text} />
              <TextInput
                style={[styles.filterTextInput, { color: colors.text }]}
                placeholder="สถานที่ (เช่น อาคารเรียนรวม 2)"
                placeholderTextColor="#94A3B8"
                value={locationFilter}
                onChangeText={setLocationFilter}
              />
              {locationFilter ? (
                <TouchableOpacity onPress={() => setLocationFilter('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* 2. Category Input */}
            <View style={[styles.filterInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="folder" size={18} color={colors.text} />
              <TextInput
                style={[styles.filterTextInput, { color: colors.text }]}
                placeholder="หมวดหมู่ (เช่น โทรศัพท์, กุญแจ)"
                placeholderTextColor="#94A3B8"
                value={categoryFilter}
                onChangeText={setCategoryFilter}
              />
              {categoryFilter ? (
                <TouchableOpacity onPress={() => setCategoryFilter('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* 3. Time Range Input */}
            <View style={[styles.filterInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="calendar" size={18} color={colors.text} />
              <TextInput
                style={[styles.filterTextInput, { color: colors.text }]}
                placeholder="ช่วงเวลา"
                placeholderTextColor="#94A3B8"
                value={timeFilter}
                onChangeText={setTimeFilter}
              />
              {timeFilter ? (
                <TouchableOpacity onPress={() => setTimeFilter('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Orange Search Button */}
            <TouchableOpacity
              style={[styles.orangeSubmitBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.88}
            >
              <Text style={styles.orangeSubmitBtnText}>ค้นหา</Text>
            </TouchableOpacity>
          </View>

          {/* ผลการค้นหา Header */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>ผลการค้นหา</Text>

          {/* Results List */}
          <View style={styles.resultsList}>
            {searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={44} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>ไม่พบสิ่งของที่ตรงกับเงื่อนไข</Text>
              </View>
            ) : (
              searchResults.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={[
                    styles.resultCard,
                    { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadowColor },
                  ]}
                  onPress={() => onSelectPost(post)}
                  activeOpacity={0.88}
                >
                  <View style={[styles.resultThumbnailBox, { backgroundColor: isDark ? colors.surfaceAlt : '#E2E8F0' }]}>
                    {post.imageUrl ? (
                      <Image source={{ uri: post.imageUrl }} style={styles.resultThumbnail} resizeMode="cover" />
                    ) : (
                      <Ionicons name="cube-outline" size={28} color={colors.textMuted} />
                    )}
                  </View>

                  <View style={styles.resultDetails}>
                    <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                      {post.title}
                    </Text>
                    <Text style={[styles.resultLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                      {post.location}
                    </Text>
                    <Text style={[styles.resultTime, { color: colors.textMuted }]}>
                      {post.dateTime || 'เมื่อสักครู่'}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        /* ================= MODE 2: CAMPUS MAP VIEW (ค้นหา.png) ================= */
        <View style={styles.mapContainer}>
          {/* SUT Illustrated Map Container */}
          <View style={[styles.mapVisual, { backgroundColor: isDark ? '#1E293B' : '#E8F5E9' }]}>
            {/* SUT Buildings Badges */}
            <View style={[styles.mapBadge, { top: 60, left: 30, backgroundColor: '#FFF7ED', borderColor: colors.primary }]}>
              <Ionicons name="cafe" size={14} color={colors.primary} />
              <Text style={[styles.mapBadgeText, { color: colors.primary }]}>กาแฟพันธุ์ไทย @B1</Text>
            </View>

            <View style={[styles.mapBadge, { top: 130, left: 100, backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }]}>
              <Ionicons name="bag" size={14} color="#3B82F6" />
              <Text style={[styles.mapBadgeText, { color: '#3B82F6' }]}>U-Store มทส.</Text>
            </View>

            <View style={[styles.mapBadge, { top: 200, right: 30, backgroundColor: '#FFF7ED', borderColor: colors.primary }]}>
              <Ionicons name="cafe" size={14} color={colors.primary} />
              <Text style={[styles.mapBadgeText, { color: colors.primary }]}>Fresh Me มทส. B1</Text>
            </View>

            <View style={[styles.mapCenterBuilding, { backgroundColor: isDark ? '#334155' : '#FEF3C7', borderColor: '#F59E0B' }]}>
              <Ionicons name="school" size={24} color="#D97706" />
              <Text style={[styles.mapCenterText, { color: colors.text }]}>อาคารเรียนรวม 1 (B1)</Text>
            </View>

            <View style={[styles.mapBadge, { bottom: 20, left: 20, backgroundColor: '#F1F5F9', borderColor: '#64748B' }]}>
              <Ionicons name="restaurant" size={14} color="#475569" />
              <Text style={[styles.mapBadgeText, { color: '#475569' }]}>โรงอาหารเรียนรวม 2</Text>
            </View>
          </View>

          {/* Near You Bottom Sheet */}
          <View style={[styles.nearYouSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.nearYouTitle, { color: colors.text }]}>ใกล้คุณ</Text>

            <ScrollView contentContainerStyle={styles.nearYouList} showsVerticalScrollIndicator={false}>
              {posts.map((post, idx) => (
                <TouchableOpacity
                  key={post.id}
                  style={[styles.nearYouCard, { borderColor: colors.borderLight }]}
                  onPress={() => onSelectPost(post)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.resultThumbnailBox, { backgroundColor: isDark ? colors.surfaceAlt : '#E2E8F0' }]}>
                    {post.imageUrl ? (
                      <Image source={{ uri: post.imageUrl }} style={styles.resultThumbnail} resizeMode="cover" />
                    ) : (
                      <Ionicons name="cube-outline" size={24} color={colors.textMuted} />
                    )}
                  </View>
                  <View style={styles.nearYouDetails}>
                    <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                      {post.title}
                    </Text>
                    <View style={styles.distanceRow}>
                      <Text style={[styles.resultLocation, { color: colors.textSecondary }]}>
                        {post.location}
                      </Text>
                      <Text style={[styles.distanceText, { color: colors.textMuted }]}>
                        • {(idx + 1) * 5 + 5} เมตร
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  filterToggleBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  filterForm: {
    gap: 10,
    marginBottom: 16,
  },
  filterInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  filterTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  orangeSubmitBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  orangeSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  resultsList: {
    gap: 10,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  resultThumbnailBox: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultThumbnail: {
    width: '100%',
    height: '100%',
  },
  resultDetails: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultLocation: {
    fontSize: 12,
  },
  resultTime: {
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  mapVisual: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  mapBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  mapCenterBuilding: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  mapCenterText: {
    fontSize: 12,
    fontWeight: '800',
  },
  nearYouSheet: {
    height: 280,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 10,
  },
  nearYouTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  nearYouList: {
    gap: 10,
    paddingBottom: 20,
  },
  nearYouCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  nearYouDetails: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
