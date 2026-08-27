import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ItemCard } from '../components/ItemCard';
import { SearchBar } from '../components/SearchBar';
import { PostItem } from '../types';

interface FoundBoardScreenProps {
  onSelectPost: (post: PostItem) => void;
  onNavigateToCreate: () => void;
}

export const FoundBoardScreen: React.FC<FoundBoardScreenProps> = ({
  onSelectPost,
  onNavigateToCreate,
}) => {
  const { posts, refreshData, isLoading } = useApp();
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'found' | 'returned'>('all');

  const foundPosts = posts.filter((p) => p.type === 'found');

  const filteredPosts = foundPosts.filter((post) => {
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'found' && post.status === 'found') ||
      (statusFilter === 'returned' && post.status === 'returned');

    const matchSearch =
      !search ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.location.toLowerCase().includes(search.toLowerCase()) ||
      post.category.toLowerCase().includes(search.toLowerCase()) ||
      post.color.toLowerCase().includes(search.toLowerCase());

    return matchStatus && matchSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>บอร์ดพบของ (Found Items)</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            พบ {foundPosts.length} รายการที่กำลังรอส่งคืนเจ้าของ
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={onNavigateToCreate}
          activeOpacity={0.85}
        >
          <Ionicons name="camera" size={16} color="#FFFFFF" />
          <Text style={styles.createBtnText}>แจ้งพบของ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="ค้นหาสิ่งของที่เก็บได้ เช่น กุญแจ, หูฟัง..."
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: colors.cardBg, borderColor: colors.border },
            statusFilter === 'all' && { backgroundColor: isDark ? colors.primary : '#0F172A', borderColor: isDark ? colors.primary : '#0F172A' },
          ]}
          onPress={() => setStatusFilter('all')}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: colors.textSecondary },
              statusFilter === 'all' && { color: '#FFFFFF', fontWeight: '700' },
            ]}
          >
            ทั้งหมด ({foundPosts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: colors.cardBg, borderColor: colors.border },
            statusFilter === 'found' && { backgroundColor: isDark ? colors.primary : '#0F172A', borderColor: isDark ? colors.primary : '#0F172A' },
          ]}
          onPress={() => setStatusFilter('found')}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: colors.textSecondary },
              statusFilter === 'found' && { color: '#FFFFFF', fontWeight: '700' },
            ]}
          >
            รอส่งคืน ({foundPosts.filter((p) => p.status === 'found').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: colors.cardBg, borderColor: colors.border },
            statusFilter === 'returned' && { backgroundColor: isDark ? colors.primary : '#0F172A', borderColor: isDark ? colors.primary : '#0F172A' },
          ]}
          onPress={() => setStatusFilter('returned')}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: colors.textSecondary },
              statusFilter === 'returned' && { color: '#FFFFFF', fontWeight: '700' },
            ]}
          >
            ส่งคืนสำเร็จ ({foundPosts.filter((p) => p.status === 'returned').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} colors={[colors.primary]} />
        }
      >
        {filteredPosts.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Ionicons name="search-outline" size={44} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>ไม่พบรายการที่ค้นหา</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>ลองเปลี่ยนคำค้นหา หรือโพสต์แจ้งพบของชิ้นใหม่</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterTabActive: {},
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterTabTextActive: {},
  scrollContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
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
