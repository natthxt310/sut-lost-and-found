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

interface LostBoardScreenProps {
  onSelectPost: (post: PostItem) => void;
  onNavigateToCreate: () => void;
}

export const LostBoardScreen: React.FC<LostBoardScreenProps> = ({
  onSelectPost,
  onNavigateToCreate,
}) => {
  const { posts, refreshData, isLoading } = useApp();
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lost' | 'returned'>('all');

  const lostPosts = posts.filter((p) => p.type === 'lost');

  const filteredPosts = lostPosts.filter((post) => {
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'lost' && post.status === 'lost') ||
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>บอร์ดของหาย (Lost Items)</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            พบ {lostPosts.length} รายการที่กำลังตามหา
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={onNavigateToCreate}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.createBtnText}>แจ้งของหาย</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="ค้นหาของหายใน มทส. เช่น กุญแจ, บัตร..."
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
            ทั้งหมด ({lostPosts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: colors.cardBg, borderColor: colors.border },
            statusFilter === 'lost' && { backgroundColor: isDark ? colors.primary : '#0F172A', borderColor: isDark ? colors.primary : '#0F172A' },
          ]}
          onPress={() => setStatusFilter('lost')}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: colors.textSecondary },
              statusFilter === 'lost' && { color: '#FFFFFF', fontWeight: '700' },
            ]}
          >
            ยังไม่เจอ ({lostPosts.filter((p) => p.status === 'lost').length})
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
            ส่งคืนแล้ว ({lostPosts.filter((p) => p.status === 'returned').length})
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
            <Text style={[styles.emptyTitle, { color: colors.text }]}>ไม่พบรายการของหายที่ค้นหา</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>ลองเปลี่ยนคำค้นหา หรือกดแจ้งของหายใหม่</Text>
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
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#EF4444',
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
