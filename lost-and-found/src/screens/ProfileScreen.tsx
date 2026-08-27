import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ItemCard } from '../components/ItemCard';
import { PostItem, ItemStatus } from '../types';

// =========================================================================
// 👤 หน้าโปรไฟล์และจัดการบัญชี (Profile Screen)
// =========================================================================
// 💡 อธิบายการทำงานแบบเข้าใจง่าย:
// หน้านี้สำหรับดูข้อมูลส่วนตัวของนักศึกษา และจัดการสิ่งของที่ตัวเองเคยโพสต์
// 
// 📌 ฟีเจอร์หลักในหน้านี้:
// 1. การ์ดข้อมูลนักศึกษา มทส. (รหัสนักศึกษา, ชื่อ, เบอร์โทร, อีเมล)
// 2. ปุ่มแก้ไขข้อมูลโปรไฟล์ (แก้ไขชื่อ-เบอร์โทร แล้วบันทึกทันที)
// 3. 🌙 สวิตช์เปิด/ปิด Dark Theme (โหมดมืด) สลับสีทั้งแอปได้ทันทีแบบ Real-time
// 4. ข้อมูลและลิงก์เข้า Web Admin สำหรับผู้ดูแลระบบ
// 5. สรุปสถิติ & รายการโพสต์ทั้งหมดของตัวเอง พร้อมปุ่มแตะเปลี่ยนสถานะด่วน (ยังไม่เจอ ➔ เจอแล้ว ➔ ส่งคืนแล้ว)
// =========================================================================

interface ProfileScreenProps {
  onSelectPost: (post: PostItem) => void;
  onOpenAuth: () => void;
  onOpenFavorites?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onSelectPost,
  onOpenAuth,
  onOpenFavorites,
}) => {
  const { user, posts, updateProfile, updatePost, logout } = useApp();
  const { colors, isDark, toggleTheme } = useTheme();

  // สถานะสำหรับเปิด/ปิด Modal แก้ไขข้อมูลโปรไฟล์
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // ดึงเฉพาะโพสต์ที่เป็นของตัวเอง
  const myPosts = posts.filter((p) => p.userId === user?.id || p.userEmail === user?.email);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ fullName, phone });
      setEditModalVisible(false);
      Alert.alert('สำเร็จ', 'อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว');
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleQuickStatusChange = async (postId: string, currentStatus: ItemStatus) => {
    const nextStatus: ItemStatus =
      currentStatus === 'lost'
        ? 'found'
        : currentStatus === 'found'
        ? 'returned'
        : 'lost';
    try {
      await updatePost(postId, { status: nextStatus });
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะได้');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* การ์ดโปรไฟล์นักศึกษา มทส. */}
        <View style={[styles.profileCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, shadowColor: colors.shadowColor }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarLarge, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
              <Ionicons name="person" size={36} color={colors.primary} />
            </View>
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: colors.text }]}>{user?.fullName || 'นักศึกษา มทส.'}</Text>
              <Text style={[styles.studentIdBadge, { color: colors.primary }]}>
                รหัสนักศึกษา: {user?.studentId || 'B6800000'}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || 'student@g.sut.ac.th'}</Text>
            </View>
          </View>

          <View style={[styles.contactRow, { borderTopColor: colors.borderLight }]}>
            <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>เบอร์โทร: {user?.phone || 'ยังไม่ระบุ'}</Text>
          </View>

          <View style={styles.profileActions}>
            <TouchableOpacity
              style={[styles.editProfileBtn, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}
              onPress={() => {
                setFullName(user?.fullName || '');
                setPhone(user?.phone || '');
                setEditModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={[styles.editProfileText, { color: colors.primary }]}>แก้ไขข้อมูล</Text>
            </TouchableOpacity>

            {onOpenFavorites && (
              <TouchableOpacity
                style={[styles.favShortcutBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FEE2E2' }]}
                onPress={onOpenFavorites}
                activeOpacity={0.8}
              >
                <Ionicons name="heart" size={16} color={colors.danger} />
                <Text style={[styles.favShortcutText, { color: colors.danger }]}>รายการโปรด</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.switchAccountBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              onPress={onOpenAuth}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.switchAccountText, { color: colors.textSecondary }]}>สลับบัญชี</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🌙 Dark Theme Toggle Setting Card */}
        <View style={[styles.themeCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.themeCardLeft}>
            <View style={[styles.themeIconCircle, { backgroundColor: isDark ? 'rgba(251, 146, 60, 0.2)' : '#FEF3C7' }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? colors.primary : '#D97706'} />
            </View>
            <View>
              <Text style={[styles.themeCardTitle, { color: colors.text }]}>
                {isDark ? 'โหมดมืด (Dark Theme)' : 'โหมดสว่าง (Light Theme)'}
              </Text>
              <Text style={[styles.themeCardSubtitle, { color: colors.textSecondary }]}>
                {isDark ? 'เปิดใช้งานอยู่ • สบายตาในที่มืด' : 'เปิดใช้งานอยู่ • สีสันสดใส'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#CBD5E1', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* 💻 Admin Portal Quick Info Card */}
        <View style={[styles.adminInfoCard, { backgroundColor: isDark ? 'rgba(2, 136, 209, 0.15)' : '#F0F9FF', borderColor: isDark ? 'rgba(2, 136, 209, 0.3)' : '#BAE6FD' }]}>
          <View style={[styles.adminInfoIcon, { backgroundColor: isDark ? 'rgba(2, 136, 209, 0.25)' : '#E0F2FE' }]}>
            <Ionicons name="desktop-outline" size={22} color={colors.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.adminInfoTitle, { color: colors.info }]}>ระบบจัดการสำหรับแอดมิน (Web Admin)</Text>
            <Text style={[styles.adminInfoDesc, { color: colors.textSecondary }]}>
              เปิดผ่านเบราว์เซอร์ที่: <Text style={{ fontWeight: '700', color: colors.info }}>http://localhost:3000/admin</Text> เพื่อดูกราฟสถิติและคัดกรองโพสต์
            </Text>
          </View>
        </View>

        {/* สรุปสถิติโพสต์ของฉัน */}
        <View style={[styles.myStatsRow, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.myStatBox}>
            <Text style={[styles.myStatNum, { color: colors.text }]}>{myPosts.length}</Text>
            <Text style={[styles.myStatLabel, { color: colors.textSecondary }]}>โพสต์ทั้งหมดของฉัน</Text>
          </View>
          <View style={styles.myStatBox}>
            <Text style={[styles.myStatNum, { color: colors.danger }]}>
              {myPosts.filter((p) => p.status === 'lost').length}
            </Text>
            <Text style={[styles.myStatLabel, { color: colors.textSecondary }]}>ยังไม่เจอ</Text>
          </View>
          <View style={styles.myStatBox}>
            <Text style={[styles.myStatNum, { color: colors.success }]}>
              {myPosts.filter((p) => p.status === 'returned').length}
            </Text>
            <Text style={[styles.myStatLabel, { color: colors.textSecondary }]}>ส่งคืนสำเร็จ</Text>
          </View>
        </View>

        {/* รายการโพสต์ของฉัน */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            รายการประกาศของฉัน ({myPosts.length})
          </Text>
        </View>

        {myPosts.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Ionicons name="documents-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>คุณยังไม่มีรายการประกาศ</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              เมื่อคุณสร้างโพสต์ของหายหรือพบของ โพสต์จะถูกรวบรวมไว้ที่นี่
            </Text>
          </View>
        ) : (
          myPosts.map((post) => (
            <View key={post.id} style={styles.myPostWrapper}>
              <ItemCard
                item={post}
                onPress={() => onSelectPost(post)}
              />
              <View style={[styles.quickStatusBar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.quickStatusTitle, { color: colors.textSecondary }]}>สถานะปัจจุบัน: </Text>
                <TouchableOpacity
                  style={[styles.toggleStatusBtn, { backgroundColor: colors.primaryBg }]}
                  onPress={() => handleQuickStatusChange(post.id, post.status)}
                >
                  <Text style={[styles.toggleStatusBtnText, { color: colors.primary }]}>
                    แตะเพื่อเปลี่ยนสถานะ ➔
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* ข้อมูลมาตรฐานและผู้จัดทำ */}
        <View style={[styles.academicCard, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
          <Text style={[styles.academicTitle, { color: colors.primary }]}>
            🎓 DGT01 1130 & DGT01 1230 Project Info
          </Text>
          <Text style={[styles.academicText, { color: colors.textSecondary }]}>
            • โครงงาน: Lost and Found (ระบบตามหาของหาย มทส. กลุ่ม 7)
          </Text>
          <Text style={[styles.academicText, { color: colors.textSecondary }]}>
            • สมาชิก: B6802189 ศิวะพร, B6802196 รพีพรรณ, B6802240 ภัทรเวท, B6803100 นัฐภัทร์, B6804145 รามเทพ
          </Text>
          <Text style={[styles.academicText, { color: colors.textSecondary }]}>
            • สถาปัตยกรรม: React Native Mobile + Next.js Web & Backend API
          </Text>
        </View>
      </ScrollView>

      {/* Modal แก้ไขโปรไฟล์ */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.modalBg }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>👤 แก้ไขข้อมูลโปรไฟล์</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              ปรับปรุงชื่อและเบอร์โทรศัพท์สำหรับติดต่อส่งมอบของ
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ชื่อ-นามสกุล</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="ระบุชื่อ-นามสกุล"
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>เบอร์โทรศัพท์</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="ระบุเบอร์โทรศัพท์ เช่น 089-123-4567"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>บันทึกข้อมูล</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 14,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 14,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
  },
  studentIdBadge: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  profileEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  contactText: {
    fontSize: 13,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  editProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '700',
  },
  favShortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
  },
  favShortcutText: {
    fontSize: 12,
    fontWeight: '700',
  },
  switchAccountBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
  },
  switchAccountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  themeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  themeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  themeCardSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  myStatsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  myStatBox: {
    alignItems: 'center',
  },
  myStatNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  myStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  myPostWrapper: {
    marginBottom: 14,
  },
  quickStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: -8,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickStatusTitle: {
    fontSize: 12,
  },
  toggleStatusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleStatusBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  academicCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  academicTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  academicText: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  adminInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    gap: 12,
  },
  adminInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  adminInfoDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
});
