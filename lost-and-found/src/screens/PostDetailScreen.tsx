import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBadge } from '../components/StatusBadge';
import { FavoriteButton } from '../components/FavoriteButton';
import { PostItem, ItemStatus } from '../types';

// =========================================================================
// 🔍 หน้ารายละเอียดโพสต์ (Post Detail Screen)
// =========================================================================
// 💡 อธิบายการทำงานแบบเข้าใจง่าย:
// แสดงข้อมูลเต็มของสิ่งของชิ้นนั้นๆ พร้อมฟีเจอร์สำคัญ:
// 1. ปุ่มบันทึกรายการโปรด (รูปหัวใจ) & ปุ่มแชร์ (Share)
// 2. ข้อมูลสิ่งของ (รูปภาพ, ชื่อ, หมวดหมู่, สี, พิกัด มทส., วันเวลา)
// 3. คำถามยืนยันสิทธิ์ (Security Question): สำหรับคนที่เก็บของได้ ตั้งคำถามป้องกันคนแอบอ้าง
// 4. ปุ่ม "ทักแชทคุย": กดเพื่อเปิดห้องแชทคุยกับคนโพสต์เพื่อขอนัดรับของ
// 5. เมนูจัดการโพสต์ (เฉพาะเจ้าของโพสต์): เปลี่ยนสถานะเป็น "ส่งคืนแล้ว" หรือ "ลบโพสต์"
// 6. รายการที่ใกล้เคียง (Auto-Matching Recommendations): แนะนำโพสต์อื่นที่อาจเป็นของชิ้นเดียวกัน
// =========================================================================

interface PostDetailScreenProps {
  post: PostItem;
  onBack: () => void;
  onSelectMatchedPost?: (post: PostItem) => void;
  onOpenChat?: (post: PostItem) => void;
}

export const PostDetailScreen: React.FC<PostDetailScreenProps> = ({
  post,
  onBack,
  onSelectMatchedPost,
  onOpenChat,
}) => {
  const { user, posts, updatePost, deletePost } = useApp();
  const { colors, isDark } = useTheme();
  const [currentPost, setCurrentPost] = useState<PostItem>(post);
  const [isUpdating, setIsUpdating] = useState(false);

  // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นเจ้าของโพสต์นี้หรือไม่
  const isMyPost = user?.id === currentPost.userId;
  const isLost = currentPost.type === 'lost';

  // 🎯 ค้นหาโพสต์อื่นที่น่าจะเป็นของชิ้นเดียวกัน (ประเภทตรงข้าม + หมวดหมู่เดียวกัน + ยังไม่ส่งคืน)
  const potentialMatches = posts.filter(
    (p) =>
      p.id !== currentPost.id &&
      p.type !== currentPost.type &&
      p.category === currentPost.category &&
      p.status !== 'returned'
  );

  const handleStatusChange = async (newStatus: ItemStatus) => {
    try {
      setIsUpdating(true);
      const updated = await updatePost(currentPost.id, { status: newStatus });
      setCurrentPost(updated);
      Alert.alert('สำเร็จ', `เปลี่ยนสถานะเป็น "${newStatus === 'returned' ? 'ส่งคืนเรียบร้อย' : newStatus === 'found' ? 'เจอแล้ว' : 'ยังไม่เจอ'}" เรียบร้อยแล้ว`);
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะได้');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'ยืนยันการลบโพสต์',
      'คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์ประกาศนี้?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบโพสต์',
          style: 'destructive',
          onPress: async () => {
            await deletePost(currentPost.id);
            Alert.alert('สำเร็จ', 'ลบโพสต์เรียบร้อยแล้ว');
            onBack();
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `[SUT Lost & Found] ${isLost ? 'ตามหาของหาย' : 'แจ้งพบของ'}: ${currentPost.title} ที่ ${currentPost.location} ติดต่อ ${currentPost.userContact}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.modalBg }]}>
      {/* Top Navigation Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.modalBg, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>รายละเอียดประกาศ</Text>
        <View style={styles.topBarActions}>
          <FavoriteButton postId={currentPost.id} size={20} />
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-social-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* รูปภาพหลัก */}
        <View style={[styles.imageWrapper, { backgroundColor: colors.surfaceAlt }]}>
          <Image source={{ uri: currentPost.imageUrl }} style={styles.mainImage} />
          <View style={[styles.typeBadge, isLost ? styles.lostBadge : styles.foundBadge]}>
            <Ionicons name={isLost ? 'alert-circle' : 'checkmark-circle'} size={16} color="#FFFFFF" />
            <Text style={styles.typeBadgeText}>
              {isLost ? 'ของหาย (Lost)' : 'พบของ (Found)'}
            </Text>
          </View>
        </View>

        <View style={styles.contentBody}>
          {/* สถานะและวันเวลา */}
          <View style={styles.statusRow}>
            <StatusBadge status={currentPost.status} type={currentPost.type} />
            <View style={styles.dateBadge}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.dateText, { color: colors.textMuted }]}>{currentPost.dateTime}</Text>
            </View>
          </View>

          {/* ชื่อสิ่งของ */}
          <Text style={[styles.title, { color: colors.text }]}>{currentPost.title}</Text>

          {/* รายละเอียดแท็ก */}
          <View style={[styles.tagsContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <View style={styles.tagItem}>
              <Ionicons name="pricetag" size={14} color={colors.primary} />
              <Text style={[styles.tagLabel, { color: colors.textSecondary }]}>หมวดหมู่:</Text>
              <Text style={[styles.tagValue, { color: colors.text }]}>{currentPost.category}</Text>
            </View>

            <View style={styles.tagItem}>
              <Ionicons name="color-palette" size={14} color={colors.primary} />
              <Text style={[styles.tagLabel, { color: colors.textSecondary }]}>สี:</Text>
              <Text style={[styles.tagValue, { color: colors.text }]}>{currentPost.color}</Text>
            </View>

            <View style={styles.tagItem}>
              <Ionicons name="location" size={14} color={colors.danger} />
              <Text style={[styles.tagLabel, { color: colors.textSecondary }]}>สถานที่ มทส.:</Text>
              <Text style={[styles.tagValue, { color: colors.text }]}>{currentPost.location}</Text>
            </View>
          </View>

          {/* รายละเอียดเพิ่มเติม */}
          <View style={styles.sectionBox}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>รายละเอียดเพิ่มเติม</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {currentPost.description || 'ไม่มีรายละเอียดเพิ่มเติมระบุไว้'}
            </Text>
          </View>

          {/* คำถามพิสูจน์สิทธิ์ (Security Question) */}
          {currentPost.securityQuestion && (
            <View style={[styles.securityBox, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
              <View style={styles.securityHeader}>
                <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                <Text style={[styles.securityTitle, { color: colors.primary }]}>คำถามพิสูจน์ความเป็นเจ้าของ</Text>
              </View>
              <Text style={[styles.securityQuestionText, { color: colors.text }]}>
                "{currentPost.securityQuestion}"
              </Text>
              <Text style={[styles.securityHint, { color: colors.textSecondary }]}>
                (กรุณาตอบคำถามนี้กับผู้เก็บได้เพื่อยืนยันว่าเป็นเจ้าของตัวจริง)
              </Text>
            </View>
          )}

          {/* กล่องข้อมูลผู้โพสต์และติดต่อ */}
          <View style={[styles.contactCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, shadowColor: colors.shadowColor }]}>
            <View style={styles.contactHeader}>
              <View style={[styles.avatarWrapper, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
                <Ionicons name="person" size={24} color={colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: colors.text }]}>{currentPost.userName}</Text>
                <Text style={[styles.contactEmail, { color: colors.textSecondary }]}>{currentPost.userEmail}</Text>
              </View>
            </View>

            <View style={[styles.contactBody, { borderTopColor: colors.borderLight }]}>
              <Text style={[styles.contactChannelTitle, { color: colors.textSecondary }]}>ช่องทางติดต่อด่วน:</Text>
              <Text style={[styles.contactChannelValue, { color: colors.primary }]}>{currentPost.userContact}</Text>
            </View>
          </View>

          {/* ปุ่มทักแชทพูดคุย In-App Direct Chat */}
          <TouchableOpacity
            style={[styles.chatActionBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (onOpenChat) onOpenChat(currentPost);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
            <Text style={styles.chatActionBtnText}>
              💬 ทักแชทคุยกับ{isLost ? 'เจ้าของโพสต์' : 'ผู้เก็บได้'} / นัดรับของ
            </Text>
          </TouchableOpacity>

          {/* เครื่องมือจัดการสำหรับเจ้าของโพสต์ */}
          {isMyPost && (
            <View style={[styles.ownerControls, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Text style={[styles.ownerControlsTitle, { color: colors.text }]}>⚙️ จัดการโพสต์ของคุณ (Post Owner)</Text>
              
              <Text style={[styles.statusChangeLabel, { color: colors.textSecondary }]}>เปลี่ยนสถานะสิ่งของ:</Text>
              <View style={styles.statusBtnGroup}>
                <TouchableOpacity
                  style={[
                    styles.statusChangeBtn,
                    { backgroundColor: colors.cardBg, borderColor: colors.border },
                    currentPost.status === 'lost' && styles.statusBtnActiveLost,
                  ]}
                  onPress={() => handleStatusChange('lost')}
                >
                  <Text style={[styles.statusBtnText, { color: colors.textSecondary }, currentPost.status === 'lost' && styles.statusBtnTextActive]}>
                    ยังไม่เจอ
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusChangeBtn,
                    { backgroundColor: colors.cardBg, borderColor: colors.border },
                    currentPost.status === 'found' && styles.statusBtnActiveFound,
                  ]}
                  onPress={() => handleStatusChange('found')}
                >
                  <Text style={[styles.statusBtnText, { color: colors.textSecondary }, currentPost.status === 'found' && styles.statusBtnTextActive]}>
                    เจอแล้ว
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusChangeBtn,
                    { backgroundColor: colors.cardBg, borderColor: colors.border },
                    currentPost.status === 'returned' && styles.statusBtnActiveReturned,
                  ]}
                  onPress={() => handleStatusChange('returned')}
                >
                  <Text style={[styles.statusBtnText, { color: colors.textSecondary }, currentPost.status === 'returned' && styles.statusBtnTextActive]}>
                    ส่งคืนสำเร็จ ✓
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.deletePostBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FFEBEE' }]}
                onPress={handleDelete}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                <Text style={[styles.deletePostText, { color: colors.danger }]}>ลบประกาศนี้</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* รายการที่มีโอกาส Match กัน */}
          {potentialMatches.length > 0 && (
            <View style={styles.matchesSection}>
              <View style={styles.matchesHeader}>
                <Ionicons name="sparkles" size={18} color={colors.primary} />
                <Text style={[styles.matchesTitle, { color: colors.primary }]}>
                  รายการที่ใกล้เคียง ({potentialMatches.length})
                </Text>
              </View>

              {potentialMatches.map((matched) => (
                <TouchableOpacity
                  key={matched.id}
                  style={[styles.matchItemCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                  onPress={() => {
                    if (onSelectMatchedPost) onSelectMatchedPost(matched);
                  }}
                >
                  <Image source={{ uri: matched.imageUrl }} style={styles.matchThumb} />
                  <View style={styles.matchInfo}>
                    <Text style={[styles.matchItemTitle, { color: colors.text }]} numberOfLines={1}>
                      {matched.title}
                    </Text>
                    <Text style={[styles.matchItemLocation, { color: colors.textSecondary }]}>📍 {matched.location}</Text>
                    <Text style={[styles.matchItemContact, { color: colors.primary }]}>ติดต่อ: {matched.userName}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 240,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  lostBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  foundBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  contentBody: {
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 14,
  },
  tagsContainer: {
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionBox: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  securityBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  securityQuestionText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  securityHint: {
    fontSize: 11,
  },
  contactCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
  },
  contactEmail: {
    fontSize: 12,
  },
  contactBody: {
    borderTopWidth: 1,
    paddingTop: 10,
  },
  contactChannelTitle: {
    fontSize: 12,
    marginBottom: 2,
  },
  contactChannelValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  ownerControls: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  ownerControlsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusChangeLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  statusBtnGroup: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  statusChangeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusBtnActiveLost: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  statusBtnActiveFound: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  statusBtnActiveReturned: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deletePostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  deletePostText: {
    fontSize: 12,
    fontWeight: '700',
  },
  matchesSection: {
    marginTop: 8,
  },
  matchesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  matchesTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  matchItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  matchThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  matchInfo: {
    flex: 1,
    marginLeft: 10,
  },
  matchItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  matchItemLocation: {
    fontSize: 11,
  },
  matchItemContact: {
    fontSize: 11,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 16,
    gap: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  chatActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
