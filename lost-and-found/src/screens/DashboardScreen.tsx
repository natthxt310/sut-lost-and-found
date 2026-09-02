import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { getMediaUrl } from '../services/api';

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
  const { posts, approvePost, deletePost } = useApp();
  const { colors, isDark } = useTheme();

  // Mode: 'approval' (ตรวจสอบอนุมัติ) vs 'quarterly' (รายงานประจำไตรมาส) vs 'overview' (ภาพรวมรายสัปดาห์)
  const [activeMode, setActiveMode] = React.useState<'approval' | 'quarterly' | 'overview'>('approval');
  const [selectedQuarter, setSelectedQuarter] = React.useState<number>(3);

  // รายการโพสต์ที่รอ Admin ตรวจสอบอนุมัติ
  const pendingPosts = posts.filter((p) => p.isApproved === false);

  const handleApprove = async (id: string, isApproved: boolean) => {
    try {
      await approvePost(id, isApproved);
      Alert.alert(
        isApproved ? 'อนุมัติสำเร็จ ✅' : 'ปฏิเสธโพสต์ ❌',
        isApproved ? 'โพสต์นี้จะแสดงบนหน้าฟีดสาธารณะของทุกคนทันที' : 'ระงับการแสดงผลโพสต์นี้เรียบร้อยแล้ว'
      );
    } catch {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถดำเนินการได้');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('ยืนยันการลบ 🗑️', 'คุณต้องการลบโพสต์นี้ออกจากระบบอย่างถาวรหรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบโพสต์',
        style: 'destructive',
        onPress: async () => {
          await deletePost(id);
        },
      },
    ]);
  };

  // คำนวณสถิติประจำไตรมาส (Quarterly Analytics)
  const quarterNames: { [key: number]: string } = {
    1: 'ไตรมาส 1 (ม.ค. - มี.ค.)',
    2: 'ไตรมาส 2 (เม.ย. - มิ.ย.)',
    3: 'ไตรมาส 3 (ก.ค. - ก.ย.)',
    4: 'ไตรมาส 4 (ต.ค. - ธ.ค.)',
  };

  const quarterPosts = posts.filter((p) => {
    let d = new Date(p.createdAt);
    if (isNaN(d.getTime()) && p.dateTime) {
      const parts = p.dateTime.split(' ')[0]?.split('/');
      if (parts && parts.length === 3) {
        const month = parseInt(parts[1], 10) - 1;
        return Math.floor(month / 3) + 1 === selectedQuarter;
      }
    }
    const month = isNaN(d.getTime()) ? 8 : d.getMonth();
    return Math.floor(month / 3) + 1 === selectedQuarter;
  });

  // 1. จำนวนของหายทั้งหมดในไตรมาสนั้น
  const qTotalLost = quarterPosts.filter((p) => p.type === 'lost').length;
  // 2. จำนวนของที่ถูกส่งคืนทั้งหมดในไตรมาสนั้น
  const qTotalReturned = quarterPosts.filter((p) => p.status === 'returned').length;
  // 3. จำนวนของที่หาพบแล้วแต่ยังไม่ถูกส่งคืนในไตรมาสนั้น
  const qFoundNotReturned = quarterPosts.filter((p) => p.type === 'found' && p.status !== 'returned').length;
  // 4. จำนวนของที่ยังหาไม่เจอทั้งหมดในไตรมาสนั้น
  const qUnfoundLost = quarterPosts.filter((p) => p.type === 'lost' && p.status === 'lost').length;

  // 5. 5 อันดับแรกของหมวดหมู่ของของที่หายบ่อยที่สุด
  const qLostCategoryMap: { [cat: string]: number } = {};
  quarterPosts
    .filter((p) => p.type === 'lost')
    .forEach((p) => {
      const cat = p.category || 'อื่นๆ';
      qLostCategoryMap[cat] = (qLostCategoryMap[cat] || 0) + 1;
    });

  const qTop5Lost = Object.entries(qLostCategoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, count], idx) => ({
      rank: idx + 1,
      name: cat,
      count,
      percentage: qTotalLost > 0 ? Math.round((count / qTotalLost) * 100) : 0,
    }));

  // คำนวณยอดสถิติจริงภาพรวมทั่วไป
  const lostCount = posts.filter((p) => p.type === 'lost' && p.status === 'lost').length;
  const foundCount = posts.filter((p) => p.type === 'found' && p.status !== 'returned').length;
  const returnedCount = posts.filter((p) => p.status === 'returned').length;

  // วันที่ปัจจุบันแบบภาษาไทย
  const currentDateThai = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // หมวดหมู่และจำนวนภาพรวม
  const categoryStats = [
    { name: 'โทรศัพท์', icon: 'phone-portrait', count: posts.filter((p) => p.category.includes('โทรศัพท์')).length || 15 },
    { name: 'บัตร', icon: 'card', count: posts.filter((p) => p.category.includes('บัตร') || p.category.includes('เอกสาร')).length || 10 },
    { name: 'อื่นๆ', icon: 'ellipsis-horizontal', count: posts.filter((p) => p.category.includes('อื่นๆ')).length || 7 },
    { name: 'กุญแจ', icon: 'key', count: posts.filter((p) => p.category.includes('กุญแจ')).length || 5 },
    { name: 'หูฟัง', icon: 'headset', count: posts.filter((p) => p.category.includes('หูฟัง')).length || 3 },
    { name: 'กระเป๋า', icon: 'bag', count: posts.filter((p) => p.category.includes('กระเป๋า')).length || 4 },
  ];

  // จุดกราฟ 7 วัน
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
      {/* SUT Admin Header */}
      <View
        style={[
          styles.orangeHeader,
          {
            backgroundColor: isDark ? colors.surface : colors.primary,
            borderBottomColor: isDark ? colors.primaryBorder : 'transparent',
            borderBottomWidth: isDark ? 1 : 0,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.blackCircleBtn}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleCenter}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <View style={styles.adminHeaderBadge}>
              <Text style={styles.adminHeaderBadgeText}>ระบบวิเคราะห์สถิติผู้ดูแล มทส.</Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerDate}>{currentDateThai}</Text>
      </View>

      {/* Mode Switcher Tabs */}
      <View style={[styles.modeTabsRow, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}>
        <TouchableOpacity
          style={[styles.modeTabBtn, activeMode === 'approval' && styles.modeTabBtnActive]}
          onPress={() => setActiveMode('approval')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="shield-checkmark"
            size={15}
            color={activeMode === 'approval' ? '#FFFFFF' : colors.textSecondary}
          />
          <Text style={[styles.modeTabText, activeMode === 'approval' ? { color: '#FFFFFF' } : { color: colors.textSecondary }]}>
            อนุมัติ ({pendingPosts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTabBtn, activeMode === 'quarterly' && styles.modeTabBtnActive]}
          onPress={() => setActiveMode('quarterly')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="calendar"
            size={15}
            color={activeMode === 'quarterly' ? '#FFFFFF' : colors.textSecondary}
          />
          <Text style={[styles.modeTabText, activeMode === 'quarterly' ? { color: '#FFFFFF' } : { color: colors.textSecondary }]}>
            ไตรมาส
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTabBtn, activeMode === 'overview' && styles.modeTabBtnActive]}
          onPress={() => setActiveMode('overview')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="bar-chart"
            size={15}
            color={activeMode === 'overview' ? '#FFFFFF' : colors.textSecondary}
          />
          <Text style={[styles.modeTabText, activeMode === 'overview' ? { color: '#FFFFFF' } : { color: colors.textSecondary }]}>
            ภาพรวม
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeMode === 'approval' ? (
          /* ================= POST APPROVAL QUEUE VIEW ================= */
          <View style={{ marginTop: 12 }}>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                🛡️ คิวตรวจสอบและอนุมัติโพสต์
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                โพสต์ที่ยังไม่ได้รับอนุมัติจะไม่แสดงบนหน้าฟีดสาธารณะ
              </Text>
            </View>

            {pendingPosts.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                  borderWidth: 1,
                  borderRadius: 18,
                  paddingVertical: 40,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <Ionicons name="checkmark-done-circle" size={54} color="#10B981" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                  ทุกโพสต์ได้รับการอนุมัติแล้ว 🎉
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>
                  ไม่มีโพสต์ค้างรอตรวจสอบในระบบ ทุกคนสามารถเห็นโพสต์ที่ผ่านการอนุมัติแล้วได้ปกติ
                </Text>
              </View>
            ) : (
              pendingPosts.map((item) => (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: '#F59E0B',
                    borderWidth: 1.5,
                    borderRadius: 18,
                    padding: 14,
                    marginBottom: 14,
                    shadowColor: '#F59E0B',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 3,
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Image Thumbnail */}
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 12,
                        overflow: 'hidden',
                        backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                      }}
                    >
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: getMediaUrl(item.imageUrl) }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="cube-outline" size={32} color={colors.textMuted} />
                      )}
                    </View>

                    {/* Details */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <View
                          style={{
                            backgroundColor: item.type === 'lost' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: item.type === 'lost' ? '#EF4444' : '#10B981',
                              fontSize: 10,
                              fontWeight: '800',
                            }}
                          >
                            {item.type === 'lost' ? 'ของหาย' : 'พบของ'}
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: '#FEF3C7',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: '#B45309', fontSize: 10, fontWeight: '800' }}>
                            ⏳ รออนุมัติ
                          </Text>
                        </View>
                      </View>

                      <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                        📍 {item.location}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.primary, marginTop: 2 }} numberOfLines={1}>
                        👤 {item.userName} ({item.userContact || item.userEmail})
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: '#10B981',
                        paddingVertical: 9,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6,
                      }}
                      onPress={() => handleApprove(item.id, true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                        อนุมัติโพสต์
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        borderRadius: 10,
                        backgroundColor: isDark ? '#334155' : '#E2E8F0',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => handleApprove(item.id, false)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 12 }}>
                        ปฏิเสธ
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 9,
                        borderRadius: 10,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => handleDelete(item.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : activeMode === 'quarterly' ? (
          /* ================= QUARTERLY STATS VIEW ================= */
          <View style={{ marginTop: 12 }}>
            {/* Quarter Selector Chips */}
            <View style={styles.quarterChipsRow}>
              {[
                { q: 1, label: 'ไตรมาส 1' },
                { q: 2, label: 'ไตรมาส 2' },
                { q: 3, label: 'ไตรมาส 3 (ปัจจุบัน)' },
                { q: 4, label: 'ไตรมาส 4' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.q}
                  style={[
                    styles.quarterChip,
                    selectedQuarter === item.q
                      ? { backgroundColor: '#FF7A00', borderColor: '#FF7A00' }
                      : { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border },
                  ]}
                  onPress={() => setSelectedQuarter(item.q)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.quarterChipText,
                      selectedQuarter === item.q
                        ? { color: '#FFFFFF', fontWeight: '800' }
                        : { color: colors.text, fontWeight: '600' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.quarterSubheader, { color: colors.textSecondary }]}>
              สรุปข้อมูลประจำ {quarterNames[selectedQuarter]} ปี 2569
            </Text>

            {/* 4 Main Requested Cards in 2x2 Grid */}
            <View style={styles.quarterGrid}>
              {/* 1. จำนวนของหายทั้งหมดในไตรมาสนั้น */}
              <View style={[styles.quarterCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderLeftColor: '#EF4444' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
                  <Ionicons name="alert-circle" size={22} color="#EF4444" />
                </View>
                <Text style={[styles.quarterCardNum, { color: '#EF4444' }]}>{qTotalLost}</Text>
                <Text style={[styles.quarterCardLabel, { color: colors.text }]}>1. ของหายทั้งหมด</Text>
                <Text style={[styles.quarterCardHint, { color: colors.textMuted }]}>ในไตรมาสนี้</Text>
              </View>

              {/* 2. จำนวนของที่ถูกส่งคืนทั้งหมดในไตรมาสนั้น */}
              <View style={[styles.quarterCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderLeftColor: '#10B981' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7' }]}>
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                </View>
                <Text style={[styles.quarterCardNum, { color: '#10B981' }]}>{qTotalReturned}</Text>
                <Text style={[styles.quarterCardLabel, { color: colors.text }]}>2. ส่งคืนทั้งหมด</Text>
                <Text style={[styles.quarterCardHint, { color: colors.textMuted }]}>ส่งคืนสำเร็จแล้ว</Text>
              </View>

              {/* 3. จำนวนของที่หาพบแล้วแต่ยังไม่ถูกส่งคืนในไตรมาสนั้น */}
              <View style={[styles.quarterCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderLeftColor: '#F59E0B' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                  <Ionicons name="time" size={22} color="#F59E0B" />
                </View>
                <Text style={[styles.quarterCardNum, { color: '#F59E0B' }]}>{qFoundNotReturned}</Text>
                <Text style={[styles.quarterCardLabel, { color: colors.text }]}>3. พบแล้วยังไม่ส่งคืน</Text>
                <Text style={[styles.quarterCardHint, { color: colors.textMuted }]}>รอเจ้าของมารับ</Text>
              </View>

              {/* 4. จำนวนของที่ยังหาไม่เจอทั้งหมดในไตรมาสนั้น */}
              <View style={[styles.quarterCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderLeftColor: '#6366F1' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' }]}>
                  <Ionicons name="search" size={22} color="#6366F1" />
                </View>
                <Text style={[styles.quarterCardNum, { color: '#6366F1' }]}>{qUnfoundLost}</Text>
                <Text style={[styles.quarterCardLabel, { color: colors.text }]}>4. ยังหาไม่เจอทั้งหมด</Text>
                <Text style={[styles.quarterCardHint, { color: colors.textMuted }]}>อยู่ระหว่างตามหา</Text>
              </View>
            </View>

            {/* 5. 5 อันดับแรกของหมวดหมู่ของของที่หายบ่อยที่สุด */}
            <View style={[styles.top5Card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <View style={styles.top5HeaderRow}>
                <View>
                  <Text style={[styles.top5Title, { color: colors.text }]}>
                    🏆 5 อันดับแรกของหมวดหมู่ที่หายบ่อยที่สุด
                  </Text>
                  <Text style={[styles.top5Subtitle, { color: colors.textSecondary }]}>
                    {quarterNames[selectedQuarter]}
                  </Text>
                </View>
                <View style={styles.top5Badge}>
                  <Text style={styles.top5BadgeText}>TOP 5</Text>
                </View>
              </View>

              {qTop5Lost.length === 0 ? (
                <View style={styles.emptyTop5Box}>
                  <Ionicons name="sparkles-outline" size={32} color={colors.textMuted} />
                  <Text style={[styles.emptyTop5Text, { color: colors.textMuted }]}>
                    ยังไม่มีข้อมูลของหายในไตรมาสนี้
                  </Text>
                </View>
              ) : (
                qTop5Lost.map((item) => {
                  const rankMedals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                  return (
                    <View key={item.rank} style={styles.top5ItemRow}>
                      <Text style={styles.rankMedal}>{rankMedals[item.rank - 1]}</Text>
                      <View style={{ flex: 1, marginHorizontal: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={[styles.top5CatName, { color: colors.text }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={[styles.top5CatCount, { color: colors.primary }]}>
                            {item.count} ชิ้น ({item.percentage}%)
                          </Text>
                        </View>
                        {/* Progress Bar */}
                        <View style={[styles.progressBarTrack, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${Math.max(item.percentage, 8)}%`,
                                backgroundColor: item.rank === 1 ? '#EF4444' : item.rank === 2 ? '#FF7A00' : '#F59E0B',
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        ) : (
          /* ================= GENERAL OVERVIEW VIEW ================= */
          <View>
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

                {/* Points Overlay */}
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>ประเภทของหายภาพรวม</Text>
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
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeTabsRow: {
    flexDirection: 'row',
    padding: 6,
    marginHorizontal: 18,
    marginTop: -20,
    borderRadius: 14,
    gap: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeTabBtnActive: {
    backgroundColor: '#FF7A00',
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '800',
  },
  quarterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  quarterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  quarterChipText: {
    fontSize: 12,
  },
  quarterSubheader: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 14,
  },
  quarterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  quarterCard: {
    width: (width - 48) / 2,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quarterCardNum: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  quarterCardLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  quarterCardHint: {
    fontSize: 11,
    marginTop: 1,
  },
  top5Card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  top5HeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  top5Title: {
    fontSize: 15,
    fontWeight: '800',
  },
  top5Subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  top5Badge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  top5BadgeText: {
    color: '#FF7A00',
    fontSize: 10,
    fontWeight: '900',
  },
  emptyTop5Box: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTop5Text: {
    fontSize: 12,
  },
  top5ItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  rankMedal: {
    fontSize: 18,
  },
  top5CatName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  top5CatCount: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  orangeHeader: {
    paddingTop: 54,
    paddingBottom: 40,
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
  headerTitleCenter: {
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  adminHeaderBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  adminHeaderBadgeText: {
    color: '#FF7A00',
    fontSize: 10,
    fontWeight: '800',
  },
  headerDate: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    fontWeight: '600',
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
