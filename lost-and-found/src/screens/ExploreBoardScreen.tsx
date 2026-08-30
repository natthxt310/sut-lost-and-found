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

const { width } = Dimensions.get('window');

/**
 * =========================================================================
 * 🔍 หน้าค้นหา & แผนที่ มทส. (Search & Real SUT Map Screen)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. โหมดค้นหา & ตัวกรอง (Search + Filters - ตามแบบ หน้าหลัก-1.png)
 * 2. โหมดแผนที่จริง (Real Map - ตามแบบ ค้นหา.png):
 *    - แสดงแผนที่จริงของ มทส. (OpenStreetMap Leaflet Map) พร้อมหมุดตำแหน่งจริง
 *    - ดึงตำแหน่ง GPS ของผู้ใช้จริง และคำนวณระยะทางจริง (Real Distance) ตามสูตร Haversine
 *    - จัดเรียงรายการ "ใกล้คุณ" ตามระยะทางจริงจากใกล้ไปไกล
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

  // สถานะการค้นหาและตัวกรอง
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory || '');
  const [timeFilter, setTimeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'filter'>('map'); // เริ่มต้นที่หน้าแผนที่จริงตามคำขอของผู้ใช้

  // พิกัด GPS ผู้ใช้จริง
  const [userLocation, setUserLocation] = useState<LatLng>(SUT_DEFAULT_CENTER);
  const [isLocating, setIsLocating] = useState(false);

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

  // คำนวณระยะทางจริงสำหรับทุกโพสต์และเรียงลำดับจากใกล้ไปไกล
  const postsWithRealDistance = posts.map((post) => {
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
      {/* Top Search & Controls Header */}
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

        {/* Search Bar Input */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: isDark ? colors.surfaceAlt : '#F8FAFC', borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="ค้นหาของหาย / พบของใน มทส."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* GPS Re-center Button */}
        <TouchableOpacity
          style={[styles.gpsBtn, { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9', borderColor: colors.border }]}
          onPress={async () => {
            setIsLocating(true);
            const loc = await getCurrentUserGpsLocation();
            setUserLocation(loc);
            setIsLocating(false);
          }}
          activeOpacity={0.8}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="locate" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {viewMode === 'map' ? (
        /* ================= MODE 1: REAL SUT MAP (ค้นหา.png) ================= */
        <View style={styles.mapContainer}>
          {/* Interactive Leaflet/OpenStreetMap Component */}
          <SUTInteractiveMap
            userLocation={userLocation}
            posts={posts}
            onSelectPost={onSelectPost}
          />

          {/* Near You Bottom Sheet (ระยะทางคำนวณจริงจากพิกัด GPS) */}
          <View style={[styles.nearYouSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.nearYouHeaderRow}>
              <Text style={[styles.nearYouTitle, { color: colors.text }]}>ใกล้คุณ</Text>
              <Text style={[styles.nearYouGpsBadge, { color: colors.primary }]}>
                📍 พิกัด GPS จริง
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.nearYouList} showsVerticalScrollIndicator={false}>
              {postsWithRealDistance.length === 0 ? (
                <View style={styles.emptyNearYou}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    ไม่พบรายการสิ่งของในบริเวณนี้
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
              onPress={() => {
                // Apply filters
              }}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
});
