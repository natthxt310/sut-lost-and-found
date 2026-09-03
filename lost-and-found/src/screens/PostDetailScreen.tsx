import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { PostItem } from '../types';
import { getMediaUrl, api } from '../services/api';

const { width } = Dimensions.get('window');

/**
 * =========================================================================
 * 📄 หน้ารายละเอียดโพสต์สิ่งของ (Post Detail Screen - ตามแบบ ค้นหา-1.png)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. รูปภาพปกขนาดใหญ่ด้านบน พร้อมปุ่มย้อนกลับวงกลมสีดำ
 * 2. การ์ดรายละเอียด: ชื่อสิ่งของ, ป้ายสถานะ (ของหาย/พบของ), สถานที่, วันเวลา, รายละเอียด, ผู้โพสต์
 * 3. 2 ปุ่มใหญ่ด้านล่าง: "ติดต่อ" (สีน้ำเงิน) & "พบของ" (สีเขียว)
 * =========================================================================
 */

interface PostDetailScreenProps {
  post: PostItem;
  onBack: () => void;
  onOpenChat: (post: PostItem) => void;
  onEditPost?: (post: PostItem) => void;
}

export const PostDetailScreen: React.FC<PostDetailScreenProps> = ({
  post,
  onBack,
  onOpenChat,
  onEditPost,
}) => {
  const { user, updatePost, deletePost, toggleFavorite, isFavorite } = useApp();
  const { colors, isDark } = useTheme();

  const isLost = post.type === 'lost';
  const isOwner = user?.id === post.userId || user?.email === post.userEmail;
  const isReturned = post.status === 'returned';
  const favorited = isFavorite(post.id);

  const handleToggleStatus = () => {
    const nextStatus = isReturned ? (isLost ? 'lost' : 'found') : 'returned';
    const confirmMessage = isReturned
      ? 'ต้องการเปิดโพสต์นี้ใหม่อีกครั้ง (เปลี่ยนสถานะเป็นยังไม่ได้รับคืน) ใช่หรือไม่?'
      : isLost
      ? 'ยินดีด้วยครับ! คุณได้รับสิ่งของนี้คืนเรียบร้อยแล้วใช่หรือไม่?'
      : 'คุณได้ส่งคืนสิ่งของนี้ให้เจ้าของเรียบร้อยแล้วใช่หรือไม่?';

    Alert.alert('เปลี่ยนสถานะโพสต์ 🔄', confirmMessage, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ยืนยัน',
        onPress: async () => {
          await updatePost(post.id, { status: nextStatus });
        },
      },
    ]);
  };

  const handleDeletePost = () => {
    Alert.alert('ยืนยันการลบโพสต์ 🗑️', `คุณต้องการลบโพสต์ "${post.title}" ออกจากระบบใช่หรือไม่?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบโพสต์',
        style: 'destructive',
        onPress: async () => {
          onBack();
          await deletePost(post.id);
        },
      },
    ]);
  };

  const handleReportInappropriate = () => {
    Alert.alert(
      '🚨 รายงานโพสต์ไม่เหมาะสม',
      'กรุณาเลือกสาเหตุที่ต้องการรายงานโพสต์นี้ถึงผู้ดูแลระบบ (Admin):',
      [
        {
          text: '📢 สแปม / โฆษณา',
          onPress: () => submitReport('spam', '📢 สแปม / โฆษณาผิดกฎหมาย'),
        },
        {
          text: '⚠️ หลอกลวง / มิจฉาชีพ',
          onPress: () => submitReport('scam', '⚠️ หลอกลวง / มิจฉาชีพเรียกเก็บเงิน'),
        },
        {
          text: '🚫 เนื้อหาไม่เหมาะสม',
          onPress: () => submitReport('offensive', '🚫 เนื้อหาไม่เหมาะสม / หยาบคาย'),
        },
        {
          text: '❌ ข้อมูลเท็จ / ก่อกวน',
          onPress: () => submitReport('false_info', '❌ ข้อมูลเท็จ / ก่อกวน'),
        },
        { text: 'ยกเลิก', style: 'cancel' },
      ]
    );
  };

  const submitReport = async (reason: string, reasonText: string) => {
    try {
      const res = await api.reportPost({
        postId: post.id,
        postTitle: post.title,
        postImageUrl: post.imageUrl,
        postCategory: post.category,
        postAuthorName: post.userName,
        reporterId: user?.id || 'usr-mobile-user',
        reporterName: user?.fullName || 'ผู้ใช้ มทส.',
        reason,
        reasonText,
        details: 'รายงานผ่านแอปพลิเคชันมือถือ',
      });
      if (res.success) {
        Alert.alert('รายงานสำเร็จ ✅', 'ระบบได้รับรายงานของคุณแล้ว ผู้ดูแลระบบจะตรวจสอบและดำเนินการทันที');
      } else {
        Alert.alert('แจ้งเตือน', res.message || 'เกิดข้อผิดพลาด');
      }
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถส่งรายงานได้');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Top Hero Image */}
        <View style={styles.heroImageContainer}>
          {post.imageUrl ? (
            <Image source={{ uri: getMediaUrl(post.imageUrl) }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
              <Ionicons name="image-outline" size={72} color={colors.textMuted} />
            </View>
          )}

          {/* Black Circular Back Button */}
          <TouchableOpacity
            style={styles.floatingBackBtn}
            onPress={onBack}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Floating Favorite Button */}
          <TouchableOpacity
            style={[
              styles.floatingFavBtn,
              favorited && { backgroundColor: isDark ? '#334155' : '#FFFFFF' },
            ]}
            onPress={() => toggleFavorite(post.id)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={22}
              color={favorited ? '#EF4444' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* White Rounded Sheet Content */}
        <View style={[styles.sheetContent, { backgroundColor: colors.surface }]}>
          {/* 🛡️ Moderation Status Alert Box (สำหรับแจ้งเตือนสถานะอนุมัติ / ปฏิเสธ) */}
          {post.moderationStatus === 'rejected' ? (
            <View
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                borderColor: '#EF4444',
                borderWidth: 1.5,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#EF4444' }}>
                  ❌ โพสต์นี้ถูกปฏิเสธโดยผู้ดูแลระบบ (ไม่อนุมัติ)
                </Text>
                <Text style={{ fontSize: 12, color: colors.text, marginTop: 3, lineHeight: 18 }}>
                  {post.moderationNotes || 'โพสต์นี้ไม่ผ่านเกณฑ์การเผยแพร่ และจะไม่แสดงบนหน้าฟีดสาธารณะของผู้อื่น'}
                </Text>
              </View>
            </View>
          ) : post.moderationStatus === 'hidden' ? (
            <View
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                borderColor: '#F59E0B',
                borderWidth: 1.5,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <Ionicons name="alert-circle" size={24} color="#F59E0B" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#F59E0B' }}>
                  ⏸️ โพสต์นี้ถูกระงับการแสดงผลชั่วคราว
                </Text>
                <Text style={{ fontSize: 12, color: colors.text, marginTop: 3, lineHeight: 18 }}>
                  {post.moderationNotes || 'มีการรายงานความไม่เหมาะสม อยู่ระหว่างรอการตรวจสอบ'}
                  {isOwner ? '\n\n💡 คำแนะนำ: คุณสามารถกดปุ่ม "แก้ไข" ด้านล่างเพื่อปรับปรุงข้อมูลให้ถูกต้อง แล้วระบบจะส่งให้ผู้ดูแลระบบตรวจสอบเพื่อปลดระงับ' : ''}
                </Text>
              </View>
            </View>
          ) : post.isApproved === false ? (
            <View
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                borderColor: '#F59E0B',
                borderWidth: 1.5,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <Ionicons name="time" size={24} color="#F59E0B" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#F59E0B' }}>
                  ⏳ โพสต์นี้กำลังรอการตรวจสอบจากผู้ดูแลระบบ
                </Text>
                <Text style={{ fontSize: 12, color: colors.text, marginTop: 3, lineHeight: 18 }}>
                  โพสต์จะแสดงบนหน้าฟีดสาธารณะของทุกคน ทันทีที่แอดมินอนุมัติเรียบร้อยแล้ว
                </Text>
              </View>
            </View>
          ) : null}

          {/* Header Row: Title & Badge */}
          <View style={styles.titleRow}>
            <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
              {post.title}
            </Text>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: isLost ? '#EF4444' : '#10B981' },
              ]}
            >
              <Text style={styles.typeBadgeText}>
                {isLost ? 'ของหาย' : 'ของที่พบ'}
              </Text>
            </View>
          </View>

          {/* Category & Color Badges */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -4, marginBottom: 14 }}>
            {post.category ? (
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#E0F2FE',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  borderWidth: 1,
                  borderColor: isDark ? '#0284C7' : '#BAE6FD',
                }}
              >
                <Ionicons name="pricetag" size={13} color="#0284C7" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#38BDF8' : '#0369A1' }}>
                  {post.category}
                </Text>
              </View>
            ) : null}

            {post.color && post.color !== 'ไม่ระบุ' ? (
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F3E8FF',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  borderWidth: 1,
                  borderColor: isDark ? '#8B5CF6' : '#DDD6FE',
                }}
              >
                <Ionicons name="color-palette" size={13} color="#8B5CF6" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#C084FC' : '#7C3AED' }}>
                  สี{post.color}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Category Info Row */}
          {post.category ? (
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={18} color="#0284C7" />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                หมวดหมู่: <Text style={{ fontWeight: '600', color: colors.text }}>{post.category}</Text>
              </Text>
            </View>
          ) : null}

          {/* Color Info Row */}
          {post.color && post.color !== 'ไม่ระบุ' ? (
            <View style={styles.infoRow}>
              <Ionicons name="color-palette-outline" size={18} color="#8B5CF6" />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                สี / โทนสี: <Text style={{ fontWeight: '600', color: colors.text }}>สี{post.color}</Text>
              </Text>
            </View>
          ) : null}

          {/* Location & Time Info */}
          <View style={styles.infoRow}>
            <Ionicons name="location-sharp" size={18} color="#64748B" />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {post.location}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#64748B" />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {post.dateTime || '15 ก.ค. 2569 12:15 น.'}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* รายละเอียด */}
          <Text style={[styles.sectionHeading, { color: colors.text }]}>รายละเอียด</Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            {post.description || 'ไม่มีรายละเอียดเพิ่มเติมระบุไว้'}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* ผู้โพสต์ */}
          <Text style={[styles.sectionHeading, { color: colors.text }]}>ผู้โพสต์</Text>
          <View style={styles.posterRow}>
            <View style={[styles.posterAvatar, { backgroundColor: '#0F172A' }]}>
              <Ionicons name="person" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.posterDetails}>
              <Text style={[styles.posterName, { color: colors.text }]}>
                {post.userName || 'ชื่อผู้ใช้งาน'} {isOwner ? ' (คุณ)' : ''}
              </Text>
              {post.userContact ? (
                <Text style={[styles.posterContact, { color: colors.textMuted }]}>
                  {post.userContact}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomActionsBar, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
        {isOwner ? (
          <>
            {/* ปุ่มแก้ไขโพสต์ */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#0055D4', flex: 1.1 }]}
              onPress={() => onEditPost?.(post)}
              activeOpacity={0.88}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>แก้ไข</Text>
              </View>
            </TouchableOpacity>

            {/* ปุ่มเปลี่ยนสถานะ */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: isReturned ? '#FF7A00' : '#10B981', flex: 1.4 },
              ]}
              onPress={handleToggleStatus}
              activeOpacity={0.88}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={isReturned ? 'refresh-outline' : 'checkmark-done-outline'} size={20} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>
                  {isReturned ? 'เปิดโพสต์ใหม่' : (isLost ? 'เจอของแล้ว' : 'ส่งคืนแล้ว')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* ปุ่มลบโพสต์ */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#EF4444', width: 52, flex: 0, paddingHorizontal: 0 }]}
              onPress={handleDeletePost}
              activeOpacity={0.88}
            >
              <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* ปุ่มติดต่อ (ส่งข้อความแชท) */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#0055D4', flex: 2 }]}
              onPress={() => onOpenChat(post)}
              activeOpacity={0.88}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
                <Text style={[styles.actionBtnText, { fontSize: 16 }]}>ติดต่อ</Text>
              </View>
            </TouchableOpacity>

            {/* ปุ่มรายงานโพสต์ไม่เหมาะสม */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#EF4444', flex: 1 }]}
              onPress={handleReportInappropriate}
              activeOpacity={0.88}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="flag-outline" size={18} color="#FFFFFF" />
                <Text style={[styles.actionBtnText, { fontSize: 15 }]}>รายงาน</Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroImageContainer: {
    width: '100%',
    height: 380,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingBackBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  floatingFavBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sheetContent: {
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  itemTitle: {
    fontSize: 22,
    fontWeight: '900',
    flex: 1,
    letterSpacing: -0.3,
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 18,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  posterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
  },
  posterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterDetails: {
    flex: 1,
  },
  posterName: {
    fontSize: 16,
    fontWeight: '800',
  },
  posterContact: {
    fontSize: 13,
    marginTop: 2,
  },
  bottomActionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 14,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
