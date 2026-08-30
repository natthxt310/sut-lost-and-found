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
}

export const PostDetailScreen: React.FC<PostDetailScreenProps> = ({
  post,
  onBack,
  onOpenChat,
}) => {
  const { user, updatePost } = useApp();
  const { colors, isDark } = useTheme();

  const isLost = post.type === 'lost';
  const isOwner = user?.id === post.userId || user?.email === post.userEmail;

  const handleReportFound = async () => {
    if (isOwner) {
      Alert.alert('จัดการโพสต์', 'ต้องการเปลี่ยนสถานะสิ่งของนี้เป็น "ส่งคืนเรียบร้อยแล้ว" หรือไม่?', [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ยืนยัน',
          onPress: async () => {
            await updatePost(post.id, { status: 'returned' });
            Alert.alert('สำเร็จ', 'อัปเดตสถานะเป็นส่งคืนเรียบร้อยแล้ว');
          },
        },
      ]);
    } else {
      Alert.alert(
        'แจ้งพบสิ่งของ',
        `คุณได้พบสิ่งของ "${post.title}" ใช่หรือไม่? ระบบจะเปิดห้องแชทเพื่อนัดส่งคืนเจ้าของทันที`,
        [
          { text: 'ยกเลิก', style: 'cancel' },
          {
            text: 'ส่งข้อความนัดรับ',
            onPress: () => onOpenChat(post),
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Top Hero Image */}
        <View style={styles.heroImageContainer}>
          {post.imageUrl ? (
            <Image source={{ uri: post.imageUrl }} style={styles.heroImage} resizeMode="cover" />
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
        </View>

        {/* White Rounded Sheet Content */}
        <View style={[styles.sheetContent, { backgroundColor: colors.surface }]}>
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
                {post.userName || 'ชื่อผู้ใช้งาน'}
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

      {/* 2 Bottom Action Buttons: ติดต่อ (Blue) & พบของ (Green) */}
      <View style={[styles.bottomActionsBar, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#0055D4' }]}
          onPress={() => onOpenChat(post)}
          activeOpacity={0.88}
        >
          <Text style={styles.actionBtnText}>ติดต่อ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
          onPress={handleReportFound}
          activeOpacity={0.88}
        >
          <Text style={styles.actionBtnText}>พบของ</Text>
        </TouchableOpacity>
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
