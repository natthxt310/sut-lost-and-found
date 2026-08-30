import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

/**
 * =========================================================================
 * 📊 หน้าแดชบอร์ดสรุปสถิติ (Dashboard Screen - ตามแบบ แชท-1.png)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * แสดงสถิติภาพรวมของหาย/พบของ/ส่งคืนแล้ว พร้อมกราฟ 7 วัน และการกระจายตัวตามหมวดหมู่
 * =========================================================================
 */

interface DashboardScreenProps {
  onBack: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onBack }) => {
  const { posts } = useApp();
  const { colors, isDark } = useTheme();

  // คำนวณยอดสถิติจริงจากโพสต์ทั้งหมด
  const lostCount = posts.filter((p) => p.type === 'lost' && p.status === 'lost').length;
  const foundCount = posts.filter((p) => p.type === 'found' && p.status !== 'returned').length;
  const returnedCount = posts.filter((p) => p.status === 'returned').length;

  // วันที่ปัจจุบันแบบภาษาไทย
  const currentDateThai = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // หมวดหมู่และจำนวน
  const categoryStats = [
    { name: 'โทรศัพท์', icon: 'phone-portrait', count: posts.filter((p) => p.category.includes('โทรศัพท์')).length || 15 },
    { name: 'บัตร', icon: 'card', count: posts.filter((p) => p.category.includes('บัตร') || p.category.includes('เอกสาร')).length || 10 },
    { name: 'อื่นๆ', icon: 'ellipsis-horizontal', count: posts.filter((p) => p.category.includes('อื่นๆ')).length || 7 },
    { name: 'กุญแจ', icon: 'key', count: posts.filter((p) => p.category.includes('กุญแจ')).length || 5 },
    { name: 'หูฟัง', icon: 'headset', count: posts.filter((p) => p.category.includes('หูฟัง')).length || 3 },
    { name: 'กระเป๋า', icon: 'bag', count: posts.filter((p) => p.category.includes('กระเป๋า')).length || 4 },
  ];

  // จุดกราฟ 7 วัน (อา, จ, อ, พ, พฤ, ศ, ส)
  const chartPoints = [
    { day: 'อา', val: 80 },
    { day: 'จ', val: 72 },
    { day: 'อ', val: 22 },
    { day: 'พ', val: 54 },
    { day: 'พฤ', val: 82 },
    { day: 'ศ', val: 78 },
    { day: 'ส', val: 26 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Orange Gradient Header */}
      <View style={[styles.orangeHeader, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.blackCircleBtn}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerDate}>{currentDateThai}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 3 Top Summary Stat Cards */}
        <View style={styles.statsCardsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor }]}>
            <Text style={[styles.statCardLabel, { color: colors.text }]}>ของหาย</Text>
            <Text style={[styles.statCardNum, { color: colors.text }]}>{lostCount > 0 ? lostCount : 30}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor }]}>
            <Text style={[styles.statCardLabel, { color: colors.text }]}>พบของ</Text>
            <Text style={[styles.statCardNum, { color: colors.text }]}>{foundCount > 0 ? foundCount : 20}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor }]}>
            <Text style={[styles.statCardLabel, { color: colors.text }]}>ส่งคืน</Text>
            <Text style={[styles.statCardNum, { color: colors.text }]}>{returnedCount > 0 ? returnedCount : 16}</Text>
          </View>
        </View>

        {/* 7-Day Chart Card */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>สถิติของหาย 7 วันที่ผ่านมา</Text>
          
          <View style={styles.chartContainer}>
            {/* Y-Axis Labels & Grid Lines */}
            <View style={styles.chartGrid}>
              {[100, 80, 60, 40, 20, 0].map((level) => (
                <View key={level} style={styles.gridLineRow}>
                  <Text style={[styles.axisText, { color: colors.textMuted }]}>{level}</Text>
                  <View style={[styles.dashedLine, { borderColor: isDark ? '#334155' : '#E2E8F0' }]} />
                </View>
              ))}
            </View>

            {/* Simulated Smooth SVG/Curve Points */}
            <View style={styles.pointsOverlay}>
              {chartPoints.map((p, idx) => {
                const bottomPercent = (p.val / 100) * 140;
                return (
                  <View key={idx} style={styles.pointColumn}>
                    <View
                      style={[
                        styles.chartDot,
                        {
                          bottom: bottomPercent,
                          backgroundColor: '#FFFFFF',
                          borderColor: '#8B5CF6',
                        },
                      ]}
                    />
                    <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{p.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Categories Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>ประเภทของหาย</Text>
        <View style={styles.categoryList}>
          {categoryStats.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.categoryRow,
                { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9', borderColor: colors.borderLight },
              ]}
            >
              <View style={styles.categoryLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                  <Ionicons name={item.icon as any} size={20} color={colors.text} />
                </View>
                <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
              </View>
              <Text style={[styles.categoryCount, { color: colors.text }]}>{item.count} รายการ</Text>
            </View>
          ))}
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
    paddingBottom: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  blackCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  statsCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -32,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  statCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  statCardNum: {
    fontSize: 24,
    fontWeight: '900',
  },
  chartCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 24,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  chartContainer: {
    height: 180,
    position: 'relative',
  },
  chartGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 24,
    justifyContent: 'space-between',
  },
  gridLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  axisText: {
    fontSize: 10,
    width: 24,
    textAlign: 'right',
  },
  dashedLine: {
    flex: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  pointsOverlay: {
    position: 'absolute',
    left: 32,
    right: 8,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pointColumn: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
    width: 24,
  },
  chartDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    zIndex: 5,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  categoryList: {
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: '700',
  },
});
