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
  Modal,
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
import { SUT_LOCATION_GROUPS, SUT_LOCATIONS_DATA } from '../data/locationsData';
import { SUTDateTimePickerModal } from '../components/SUTDateTimePickerModal';

const { width, height } = Dimensions.get('window');

/**
 * =========================================================================
 * 🔍 หน้าค้นหา & แผนที่ มทส. (Search & Interactive SUT Map Screen)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. ครอบคลุมสถานที่ครบทุกแห่งใน มทส. (28+ แห่ง แบ่ง 7 โซน)
 * 2. หมวดหมู่สิ่งของละเอียดครบ 17+ หมวด
 * 3. แถบเลือกสถานที่ & หมวดหมู่แบบ Bottom Sheet พร้อมช่องค้นหาในตัว
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

  // Modal Sheet States
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
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

        {/* Search Bar Input */}
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

        {/* GPS Location Sensor Button (ปุ่มมุมขวาบน) */}
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

      {/* 2. Horizontal Quick Tag Chips Bar */}
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

          {/* Near You Bottom Sheet */}
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
          {/* ตัวกรองการค้นหา Header */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ตัวกรองการค้นหา</Text>

          <View style={styles.filterForm}>
            {/* 1. ประเภท: ทั้งหมด / ของหาย / ของที่พบ */}
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

            {/* 2. ช่องแตะเลือกสถานที่ (Location Selector Field) */}
            <TouchableOpacity
              style={[styles.filterSelectorField, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setLocationModalVisible(true)}
              activeOpacity={0.85}
            >
              <View style={styles.fieldLeft}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <View style={styles.fieldTextContainer}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>สถานที่ใน มทส. (28+ แห่ง 7 โซน)</Text>
                  <Text style={[styles.fieldValue, { color: colors.text }]} numberOfLines={1}>
                    {selectedLocation}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* 3. ช่องแตะเลือกหมวดหมู่ (Category Selector Field) */}
            <TouchableOpacity
              style={[styles.filterSelectorField, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setCategoryModalVisible(true)}
              activeOpacity={0.85}
            >
              <View style={styles.fieldLeft}>
                <Ionicons name="folder-open" size={20} color={colors.primary} />
                <View style={styles.fieldTextContainer}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>หมวดหมู่สิ่งของ (17+ หมวดหมู่)</Text>
                  <Text style={[styles.fieldValue, { color: colors.text }]} numberOfLines={1}>
                    {selectedTag}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* 4. ช่องแตะเลือกวันที่เกิดเหตุ (Calendar Picker Field) */}
            <TouchableOpacity
              style={[styles.filterSelectorField, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setCalendarVisible(true)}
              activeOpacity={0.85}
            >
              <View style={styles.fieldLeft}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <View style={styles.fieldTextContainer}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ช่วงเวลา / วันที่เกิดเหตุ</Text>
                  <Text style={[styles.fieldValue, { color: timeFilter ? colors.text : colors.textMuted }]} numberOfLines={1}>
                    {timeFilter ? `วันที่: ${timeFilter}` : 'ทุกช่วงเวลา (แตะเพื่อระบุวันที่)'}
                  </Text>
                </View>
              </View>
              {timeFilter ? (
                <TouchableOpacity onPress={() => setTimeFilter('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

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

      {/* ================= MODAL: 7-ZONE SUT LOCATION SELECTOR SHEET ================= */}
      <Modal visible={locationModalVisible} animationType="slide" transparent={true}>
        <View style={[styles.sheetOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.pickerSheetCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <Ionicons name="location" size={22} color={colors.primary} />
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  สถานที่ใน มทส. (28+ แห่ง)
                </Text>
              </View>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* In-Sheet Search Bar */}
            <View style={[styles.sheetSearchBox, { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9', borderColor: colors.border }]}>
              <Ionicons name="search" size={16} color="#94A3B8" />
              <TextInput
                style={[styles.sheetSearchInput, { color: colors.text }]}
                placeholder="ค้นหาชื่ออาคาร, หอพัก, โรงอาหาร, ศูนย์กีฬา..."
                placeholderTextColor="#94A3B8"
                value={locationSearchQuery}
                onChangeText={setLocationSearchQuery}
              />
              {locationSearchQuery ? (
                <TouchableOpacity onPress={() => setLocationSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {/* Option: ทุกสถานที่ */}
              <TouchableOpacity
                style={[
                  styles.sheetOptionItem,
                  selectedLocation === 'ทุกสถานที่'
                    ? [styles.sheetOptionActive, { backgroundColor: isDark ? 'rgba(255, 122, 0, 0.2)' : '#FFF7ED', borderColor: colors.primary }]
                    : { borderBottomColor: colors.borderLight },
                ]}
                onPress={() => {
                  setSelectedLocation('ทุกสถานที่');
                  setLocationModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.sheetIconBox, { backgroundColor: selectedLocation === 'ทุกสถานที่' ? colors.primary : (isDark ? colors.surfaceAlt : '#F1F5F9') }]}>
                  <Ionicons name="globe-outline" size={20} color={selectedLocation === 'ทุกสถานที่' ? '#FFFFFF' : colors.text} />
                </View>
                <View style={styles.sheetOptionTextContainer}>
                  <Text style={[styles.sheetOptionTitle, { color: selectedLocation === 'ทุกสถานที่' ? colors.primary : colors.text }]}>
                    ทุกสถานที่ (ทั่วทั้ง มทส.)
                  </Text>
                  <Text style={[styles.sheetOptionDesc, { color: colors.textSecondary }]}>
                    ค้นหาครอบคลุมทุกอาคารและทุกโซนในมหาวิทยาลัย
                  </Text>
                </View>
                {selectedLocation === 'ทุกสถานที่' && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* 7 Groups of SUT Locations */}
              {SUT_LOCATION_GROUPS.map((group, gIdx) => {
                const filteredItems = group.items.filter(
                  (item) =>
                    !locationSearchQuery ||
                    item.name.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
                    item.desc.toLowerCase().includes(locationSearchQuery.toLowerCase())
                );

                if (filteredItems.length === 0) return null;

                return (
                  <View key={gIdx} style={styles.groupSection}>
                    <View style={[styles.groupHeaderBar, { backgroundColor: isDark ? colors.surfaceAlt : '#F8FAFC' }]}>
                      <Text style={[styles.groupHeaderText, { color: colors.primary }]}>
                        {group.zoneName}
                      </Text>
                    </View>

                    {filteredItems.map((loc, idx) => {
                      const isSelected = selectedLocation === loc.name;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.sheetOptionItem,
                            isSelected
                              ? [styles.sheetOptionActive, { backgroundColor: isDark ? 'rgba(255, 122, 0, 0.2)' : '#FFF7ED', borderColor: colors.primary }]
                              : { borderBottomColor: colors.borderLight },
                          ]}
                          onPress={() => {
                            setSelectedLocation(loc.name);
                            setLocationModalVisible(false);
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.sheetIconBox, { backgroundColor: isSelected ? colors.primary : (isDark ? colors.surfaceAlt : '#F1F5F9') }]}>
                            <Ionicons name={loc.icon as any} size={20} color={isSelected ? '#FFFFFF' : colors.text} />
                          </View>
                          <View style={styles.sheetOptionTextContainer}>
                            <Text style={[styles.sheetOptionTitle, { color: isSelected ? colors.primary : colors.text }]}>
                              {loc.name}
                            </Text>
                            <Text style={[styles.sheetOptionDesc, { color: colors.textSecondary }]}>
                              {loc.desc}
                            </Text>
                          </View>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: CATEGORY SELECTOR SHEET ================= */}
      <Modal visible={categoryModalVisible} animationType="slide" transparent={true}>
        <View style={[styles.sheetOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.pickerSheetCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <Ionicons name="folder-open" size={22} color={colors.primary} />
                <Text style={[styles.sheetTitle, { color: colors.text }]}>เลือกหมวดหมู่สิ่งของ</Text>
              </View>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* In-Sheet Search Bar */}
            <View style={[styles.sheetSearchBox, { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9', borderColor: colors.border }]}>
              <Ionicons name="search" size={16} color="#94A3B8" />
              <TextInput
                style={[styles.sheetSearchInput, { color: colors.text }]}
                placeholder="ค้นหาหมวดหมู่ เช่น iPhone, AirPods, บัตร..."
                placeholderTextColor="#94A3B8"
                value={categorySearchQuery}
                onChangeText={setCategorySearchQuery}
              />
              {categorySearchQuery ? (
                <TouchableOpacity onPress={() => setCategorySearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {/* Option: ทั้งหมด */}
              <TouchableOpacity
                style={[
                  styles.sheetOptionItem,
                  selectedTag === 'ทั้งหมด'
                    ? [styles.sheetOptionActive, { backgroundColor: isDark ? 'rgba(255, 122, 0, 0.2)' : '#FFF7ED', borderColor: colors.primary }]
                    : { borderBottomColor: colors.borderLight },
                ]}
                onPress={() => {
                  setSelectedTag('ทั้งหมด');
                  setCategoryModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.sheetIconBox, { backgroundColor: selectedTag === 'ทั้งหมด' ? colors.primary : (isDark ? colors.surfaceAlt : '#F1F5F9') }]}>
                  <Ionicons name="apps" size={20} color={selectedTag === 'ทั้งหมด' ? '#FFFFFF' : colors.text} />
                </View>
                <View style={styles.sheetOptionTextContainer}>
                  <Text style={[styles.sheetOptionTitle, { color: selectedTag === 'ทั้งหมด' ? colors.primary : colors.text }]}>
                    ทั้งหมด (ทุกหมวดหมู่)
                  </Text>
                  <Text style={[styles.sheetOptionDesc, { color: colors.textSecondary }]}>
                    แสดงสิ่งของทุกประเภทในระบบ
                  </Text>
                </View>
                {selectedTag === 'ทั้งหมด' && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* All 17+ Categories with Subtags */}
              {SUT_CATEGORIES.filter(
                (cat) =>
                  !categorySearchQuery ||
                  cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                  cat.subtags.some((st) => st.toLowerCase().includes(categorySearchQuery.toLowerCase()))
              ).map((cat, idx) => {
                const isSelected = selectedTag === cat.name;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.sheetOptionItem,
                      isSelected
                        ? [styles.sheetOptionActive, { backgroundColor: isDark ? 'rgba(255, 122, 0, 0.2)' : '#FFF7ED', borderColor: colors.primary }]
                        : { borderBottomColor: colors.borderLight },
                    ]}
                    onPress={() => {
                      setSelectedTag(cat.name);
                      setCategoryModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.sheetIconBox, { backgroundColor: isSelected ? colors.primary : (isDark ? colors.surfaceAlt : '#F1F5F9') }]}>
                      <Ionicons name={cat.icon as any} size={20} color={isSelected ? '#FFFFFF' : colors.text} />
                    </View>
                    <View style={styles.sheetOptionTextContainer}>
                      <Text style={[styles.sheetOptionTitle, { color: isSelected ? colors.primary : colors.text }]}>
                        {cat.name}
                      </Text>
                      <Text style={[styles.sheetOptionDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                        {cat.subtags.join(', ')}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
    paddingVertical: 8,
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
    marginBottom: 10,
  },
  filterForm: {
    gap: 12,
    marginBottom: 16,
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipActive: {},
  typeChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterSelectorField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 56,
  },
  fieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  fieldTextContainer: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
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
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerSheetCard: {
    height: height * 0.72,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingTop: 18,
    paddingHorizontal: 20,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  sheetSearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  sheetScroll: {
    paddingVertical: 6,
  },
  groupSection: {
    marginBottom: 12,
  },
  groupHeaderBar: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  groupHeaderText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sheetOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderBottomWidth: 1,
    gap: 12,
    marginBottom: 4,
  },
  sheetOptionActive: {
    borderWidth: 1,
    borderBottomWidth: 1,
  },
  sheetIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetOptionTextContainer: {
    flex: 1,
    gap: 2,
  },
  sheetOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sheetOptionDesc: {
    fontSize: 11,
  },
});
