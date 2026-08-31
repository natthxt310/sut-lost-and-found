import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { PostItem } from '../types';
import {
  LatLng,
  SUT_DEFAULT_CENTER,
  getLocationCoords,
  calculateRealDistanceMeters,
  formatRealDistance,
  getCurrentUserGpsLocation,
} from '../services/locationService';
import { SUTInteractiveMap } from '../components/SUTInteractiveMap';
import { POPULAR_TAG_CHIPS, SUT_CATEGORIES } from '../data/categoriesData';
import { SUTDateTimePickerModal } from '../components/SUTDateTimePickerModal';

const { width } = Dimensions.get('window');

// รายการสถานที่ใน มทส. สำหรับแท็บเลือกสถานที่
const SUT_LOCATION_CHIPS = [
  'ทุกสถานที่',
  'อาคารเรียนรวม 1 (B1)',
  'อาคารเรียนรวม 2 (B2)',
  'ศูนย์บรรณสารฯ (หอสมุด)',
  'โรงอาหารสุรนิเวศน์ (กาสะลอง)',
  'โรงอาหารเรียนรวม 2',
  'U-Store / Fresh Me',
  'กาแฟพันธุ์ไทย @B1',
  'อาคารบริหาร มทส.',
  'อาคารวิชาการ 1-2',
  'หอพักสุรนิเวศ',
  'ลานจอดรถ มทส.',
];

/**
 * =========================================================================
 * 🔍 หน้าค้นหา & แผนที่ มทส. (Search & Interactive SUT Map Screen)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. หมวดหมู่: แถบแท็บเลื่อนแนวนอน (Horizontal Swipeable Chips) กดเลือกได้ทันที
 * 2. สถานที่: แถบแท็บเลื่อนแนวนอน (Horizontal Swipeable Chips) กดเลือกได้ทันที
 * 3. ปุ่ม GPS ขวาบน: ปุ่มดึงพิกัดตำแหน่ง GPS ปัจจุบันของผู้ใช้จาก Sensor
 * =========================================================================
 */

interface ExploreBoardScreenProps {
  onSelectPost: (post: PostItem) => void;
  initialCategory?: string;
  initialViewMode?: 'map' | 'filter';
}

export const ExploreBoardScreen: React.FC<ExploreBoardScreenProps> = ({
  onSelectPost,
  initialCategory,
  initialViewMode = 'map',
}) => {
  const { posts } = useApp();
  const { colors, isDark } = useTheme();

  // สถานะการค้นหาและตัวกรอง
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(initialCategory || 'ทั้งหมด');
  const [selectedLocation, setSelectedLocation] = useState('ทุกสถานที่');
  const [timeFilter, setTimeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [viewMode, setViewMode] = useState<'map' | 'filter'>(initialViewMode);

  // Calendar Modal for Search
  const [calendarVisible, setCalendarVisible] = useState(false);

  // GPS Sensor & Toast States
  const [userLocation, setUserLocation] = useState<LatLng>(SUT_DEFAULT_CENTER);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsToast, setGpsToast] = useState<string | null>(null);

  // Sync initialCategory
  useEffect(() => {
    if (initialCategory) {
      setSelectedTag(initialCategory);
      setViewMode('filter');
    }
  }, [initialCategory]);

  // ดึงพิกัด GPS จริงตอนเปิดหน้า
  useEffect(() => {
    const fetchGps = async () => {
      setIsLocating(true);
      const loc = await getCurrentUserGpsLocation();
      setUserLocation(loc);
      setIsLocating(false);
    };
    fetchGps();
  }, []);

  const handleRefreshGps = async () => {
    setIsLocating(true);
    setGpsToast('📍 กำลังอ่านพิกัดจาก GPS Sensor...');
    const loc = await getCurrentUserGpsLocation();
    setUserLocation(loc);
    setIsLocating(false);
    setGpsToast('✅ อัปเดตตำแหน่ง GPS และคำนวณระยะทางเรียบร้อยแล้ว');
    setTimeout(() => {
      setGpsToast(null);
    }, 3500);
  };

  // กรองผลการค้นหาแบบละเอียด
  const searchResults = posts.filter((post) => {
    const matchSearch =
      !search ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.description.toLowerCase().includes(search.toLowerCase()) ||
      post.location.toLowerCase().includes(search.toLowerCase());

    const matchTag =
      selectedTag === 'ทั้งหมด' ||
      post.category.toLowerCase().includes(selectedTag.toLowerCase()) ||
      post.title.toLowerCase().includes(selectedTag.toLowerCase());

    const matchLocation =
      selectedLocation === 'ทุกสถานที่' ||
      post.location.toLowerCase().includes(selectedLocation.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase()) ||
      post.location.toLowerCase().includes(selectedLocation.toLowerCase());

    const matchType =
      typeFilter === 'all' || post.type === typeFilter;

    const matchTime =
      !timeFilter || (post.dateTime && post.dateTime.includes(timeFilter));

    return matchSearch && matchTag && matchLocation && matchType && matchTime;
  });

  // คำนวณระยะทางจริงสำหรับทุกโพสต์และเรียงลำดับจากใกล้ไปไกล
  const postsWithRealDistance = searchResults.map((post) => {
    const postCoords = getLocationCoords(post.location);
    const distanceMeters = calculateRealDistanceMeters(
      userLocation.lat,
      userLocation.lng,
      postCoords.lat,
      postCoords.lng
    );
    return {
      ...post,
      realDistanceMeters: distanceMeters,
      distanceFormatted: formatRealDistance(distanceMeters),
    };
  }).sort((a, b) => a.realDistanceMeters - b.realDistanceMeters);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Top Search & Controls Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        {/* Toggle Mode Button: กรอง / แผนที่ */}
        <TouchableOpacity
          style={[
            styles.modePillBtn,
            viewMode === 'filter'
              ? [styles.modePillActive, { backgroundColor: colors.primary }]
              : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
          ]}
          onPress={() => setViewMode(viewMode === 'map' ? 'filter' : 'map')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={viewMode === 'map' ? 'filter-outline' : 'map-outline'}
            size={18}
            color={viewMode === 'filter' ? '#FFFFFF' : colors.text}
          />
          <Text
            style={[
              styles.modePillText,
              viewMode === 'filter' ? { color: '#FFFFFF' } : { color: colors.text },
            ]}
          >
            {viewMode === 'map' ? 'กรอง' : 'แผนที่'}
          </Text>
        </TouchableOpacity>

        {/* Search Bar Input (กดแล้วสลับเข้าโหมดค้นหา/ตัวกรองทันที) */}
        <TouchableOpacity
          style={[
            styles.searchBar,
            { backgroundColor: isDark ? colors.surfaceAlt : '#F8FAFC', borderColor: colors.border },
          ]}
          onPress={() => setViewMode('filter')}
          activeOpacity={0.95}
        >
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="ค้นหาชื่อสิ่งของ, จุดสังเกต..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              if (viewMode !== 'filter') setViewMode('filter');
            }}
            onFocus={() => {
              if (viewMode !== 'filter') setViewMode('filter');
            }}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>

        {/* GPS Location Button (ปุ่มดึงพิกัดตำแหน่ง GPS ปัจจุบันของผู้ใช้) */}
        <TouchableOpacity
          style={[
            styles.gpsBtn,
            { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9', borderColor: colors.border },
          ]}
          onPress={handleRefreshGps}
          activeOpacity={0.8}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="locate" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* GPS Status Toast Banner */}
      {gpsToast && (
        <View style={[styles.gpsToastBanner, { backgroundColor: isDark ? '#1E293B' : '#FFF7ED', borderColor: colors.primary }]}>
          <Text style={[styles.gpsToastText, { color: colors.primary }]}>{gpsToast}</Text>
        </View>
      )}

      {/* 2. Horizontal Quick Tag Chips Bar (แท็กหมวดหมู่ยอดนิยม) */}
      <View style={[styles.tagsBarContainer, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScrollContent}>
          {POPULAR_TAG_CHIPS.map((tag, idx) => {
            const isSelected = selectedTag === tag;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.tagChip,
                  isSelected
                    ? [styles.tagChipActive, { backgroundColor: colors.primary }]
                    : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
                ]}
                onPress={() => setSelectedTag(tag)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    isSelected ? styles.tagChipTextActive : { color: colors.text },
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {viewMode === 'map' ? (
        /* ================= MODE 1: REAL SUT MAP (ค้นหา.png) ================= */
        <View style={styles.mapContainer}>
          {/* Interactive Leaflet/OpenStreetMap Component */}
          <SUTInteractiveMap
            userLocation={userLocation}
            posts={searchResults}
            onSelectPost={onSelectPost}
          />

          {/* Near You Bottom Sheet (ระยะทางคำนวณจริงจากพิกัด GPS) */}
          <View style={[styles.nearYouSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.nearYouHeaderRow}>
              <Text style={[styles.nearYouTitle, { color: colors.text }]}>
                ใกล้คุณ ({postsWithRealDistance.length} รายการ)
              </Text>
              <Text style={[styles.nearYouGpsBadge, { color: colors.primary }]}>
                📍 คำนวณจาก GPS จริง
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.nearYouList} showsVerticalScrollIndicator={false}>
              {postsWithRealDistance.length === 0 ? (
                <View style={styles.emptyNearYou}>
                  <Ionicons name="location-outline" size={36} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    ไม่พบรายการสิ่งของตามเงื่อนไขในบริเวณนี้
                  </Text>
                </View>
              ) : (
                postsWithRealDistance.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={[
                      styles.nearYouCard,
                      { backgroundColor: colors.surface, borderColor: colors.borderLight, shadowColor: colors.shadowColor },
                    ]}
                    onPress={() => onSelectPost(post)}
                    activeOpacity={0.85}
                  >
                    {/* Thumbnail */}
                    <View style={[styles.resultThumbnailBox, { backgroundColor: isDark ? colors.surfaceAlt : '#E2E8F0' }]}>
                      {post.imageUrl ? (
                        <Image source={{ uri: post.imageUrl }} style={styles.resultThumbnail} resizeMode="cover" />
                      ) : (
                        <Ionicons name="cube-outline" size={24} color={colors.textMuted} />
                      )}
                    </View>

                    {/* Details */}
                    <View style={styles.nearYouDetails}>
                      <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                        {post.title}
                      </Text>
                      <View style={styles.distanceRow}>
                        <Text style={[styles.resultLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                          {post.location}
                        </Text>
                        <Text style={[styles.distanceText, { color: colors.primary }]}>
                          • {post.distanceFormatted}
                        </Text>
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      ) : (
        /* ================= MODE 2: FILTER & SEARCH RESULTS (หน้าหลัก-1.png) ================= */
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 1. ประเภท: ทั้งหมด / ของหาย / ของที่พบ */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ประเภทรายการ</Text>
          <View style={styles.typeChipsRow}>
            <TouchableOpacity
              style={[
                styles.typeChip,
                typeFilter === 'all'
                  ? [styles.typeChipActive, { backgroundColor: colors.primary }]
                  : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
              ]}
              onPress={() => setTypeFilter('all')}
            >
              <Text style={[styles.typeChipText, typeFilter === 'all' ? { color: '#FFFFFF' } : { color: colors.text }]}>
                ทั้งหมด
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeChip,
                typeFilter === 'lost'
                  ? [styles.typeChipActive, { backgroundColor: '#EF4444' }]
                  : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
              ]}
              onPress={() => setTypeFilter('lost')}
            >
              <Text style={[styles.typeChipText, typeFilter === 'lost' ? { color: '#FFFFFF' } : { color: colors.text }]}>
                🔴 ของหาย
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeChip,
                typeFilter === 'found'
                  ? [styles.typeChipActive, { backgroundColor: '#10B981' }]
                  : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
              ]}
              onPress={() => setTypeFilter('found')}
            >
              <Text style={[styles.typeChipText, typeFilter === 'found' ? { color: '#FFFFFF' } : { color: colors.text }]}>
                🟢 ของที่พบ
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2. สถานที่ใน มทส. (เลื่อนเลือกได้ทันที) */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
            เลือกสถานที่ใน มทส. (Location)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScrollRow}>
            {SUT_LOCATION_CHIPS.map((loc, idx) => {
              const isSelected = selectedLocation === loc;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.filterChipItem,
                    isSelected
                      ? [styles.filterChipActive, { backgroundColor: colors.primary }]
                      : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
                  ]}
                  onPress={() => setSelectedLocation(loc)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="location-sharp"
                    size={14}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.filterChipItemText,
                      isSelected ? styles.filterChipItemTextActive : { color: colors.text },
                    ]}
                  >
                    {loc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 3. หมวดหมู่สิ่งของ (เลื่อนเลือกได้ทันที) */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
            เลือกหมวดหมู่สิ่งของ (Category)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScrollRow}>
            {POPULAR_TAG_CHIPS.map((cat, idx) => {
              const isSelected = selectedTag === cat;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.filterChipItem,
                    isSelected
                      ? [styles.filterChipActive, { backgroundColor: colors.primary }]
                      : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
                  ]}
                  onPress={() => setSelectedTag(cat)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="folder-open"
                    size={14}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.filterChipItemText,
                      isSelected ? styles.filterChipItemTextActive : { color: colors.text },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 4. วันที่เกิดเหตุ (Calendar Picker) */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
            ช่วงเวลา / วันที่เกิดเหตุ
          </Text>
          <TouchableOpacity
            style={[styles.filterInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setCalendarVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar" size={18} color={colors.primary} />
            <Text style={[styles.filterTextInput, { color: timeFilter ? colors.text : '#94A3B8' }]}>
              {timeFilter ? `วันที่: ${timeFilter}` : 'แตะเพื่อเลือกวันที่ (Calendar)'}
            </Text>
            {timeFilter ? (
              <TouchableOpacity onPress={() => setTimeFilter('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>

          {/* 5. ผลการค้นหา Header */}
          <View style={styles.resultsHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
              ผลการค้นหา ({searchResults.length} รายการ)
            </Text>
            {(search || selectedLocation !== 'ทุกสถานที่' || selectedTag !== 'ทั้งหมด' || timeFilter || typeFilter !== 'all') && (
              <TouchableOpacity
                onPress={() => {
                  setSearch('');
                  setSelectedLocation('ทุกสถานที่');
                  setSelectedTag('ทั้งหมด');
                  setTimeFilter('');
                  setTypeFilter('all');
                }}
              >
                <Text style={[styles.clearFilterText, { color: colors.primary }]}>ล้างตัวกรองทั้งหมด</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Results List */}
          <View style={styles.resultsList}>
            {searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  ไม่พบสิ่งของที่ตรงกับเงื่อนไขการค้นหา
                </Text>
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
                    <View style={styles.resultTitleRow}>
                      <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                        {post.title}
                      </Text>
                      <View
                        style={[
                          styles.miniBadge,
                          { backgroundColor: post.type === 'lost' ? '#EF4444' : '#10B981' },
                        ]}
                      >
                        <Text style={styles.miniBadgeText}>
                          {post.type === 'lost' ? 'ของหาย' : 'พบของ'}
                        </Text>
                      </View>
                    </View>

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
      )}

      {/* SUT Calendar Modal for Search */}
      <SUTDateTimePickerModal
        visible={calendarVisible}
        mode="date"
        currentValue={timeFilter}
        onConfirm={(val) => setTimeFilter(val)}
        onClose={() => setCalendarVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
  },
  modePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
  },
  modePillActive: {},
  modePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  gpsBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsToastBanner: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  gpsToastText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagsBarContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tagsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagChipActive: {},
  tagChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  mapContainer: {
    flex: 1,
  },
  nearYouSheet: {
    height: 290,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 8,
  },
  nearYouHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nearYouTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  nearYouGpsBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  nearYouList: {
    gap: 10,
    paddingBottom: 24,
  },
  nearYouCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  nearYouDetails: {
    flex: 1,
    gap: 3,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyNearYou: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipActive: {},
  typeChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipsScrollRow: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  filterChipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  filterChipActive: {},
  filterChipItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: '700',
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
    width: 54,
    height: 54,
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
  resultTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 6,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  miniBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
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
});
