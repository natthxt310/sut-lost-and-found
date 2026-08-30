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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { PostItem } from '../types';

const { width } = Dimensions.get('window');

/**
 * =========================================================================
 * 👤 หน้าโปรไฟล์ผู้ใช้ & แก้ไขข้อมูล (Profile & Edit Screen - ตามแบบ โปรไฟล์.png และ แก้ไขโปรไฟล์.png)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. ส่วนหัวสีส้ม SUT Orange รูปโปรไฟล์ใหญ่พร้อมดินสอ, ชื่อ และรหัสนักศึกษา
 * 2. กล่องสถิติ 3 ช่อง: โพสต์, พบของ, ส่งคืน
 * 3. รายการเมนู: ประวัติการโพสต์, รายการที่บันทึก, การตั้งค่า, ช่วยเหลือ, ออกจากระบบ
 * 4. หน้าต่างแก้ไขโปรไฟล์ (Edit Profile Modal): แก้ไขชื่อ, เบอร์โทร, คณะ, อีเมล
 * =========================================================================
 */

interface ProfileScreenProps {
  onOpenMyPosts: () => void;
  onOpenFavorites: () => void;
  onOpenDashboard: () => void;
  onOpenAuth: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenMyPosts,
  onOpenFavorites,
  onOpenDashboard,
  onOpenAuth,
}) => {
  const { user, posts, updateProfile, logout } = useApp();
  const { colors, isDark, toggleTheme, autoLightSensor, toggleAutoLightSensor, currentLux } = useTheme();

  // Edit Profile Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [faculty, setFaculty] = useState('สำนักวิชาวิศวกรรมศาสตร์');
  const [email, setEmail] = useState(user?.email || '');

  // คำนวณยอดสถิติของตัวเอง
  const myPosts = posts.filter((p) => p.userId === user?.id || p.userEmail === user?.email);
  const myLostCount = myPosts.filter((p) => p.type === 'lost').length;
  const myFoundCount = myPosts.filter((p) => p.type === 'found').length;
  const myReturnedCount = myPosts.filter((p) => p.status === 'returned').length;

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ fullName, phone, email });
      setEditModalVisible(false);
      Alert.alert('สำเร็จ', 'อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว');
    } catch {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleLogout = () => {
    Alert.alert('ออกจากระบบ', 'คุณต้องการออกจากระบบหรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ออกจากระบบ',
        style: 'destructive',
        onPress: () => {
          logout();
          onOpenAuth();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Orange Gradient Header with Large Avatar */}
        <View style={[styles.orangeHeader, { backgroundColor: colors.primary }]}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => {
              setFullName(user?.fullName || '');
              setPhone(user?.phone || '');
              setEmail(user?.email || '');
              setEditModalVisible(true);
            }}
            activeOpacity={0.88}
          >
            <View style={styles.largeAvatarCircle}>
              <Ionicons name="person" size={54} color="#FF7A00" />
            </View>
            {/* Pencil Icon Badge */}
            <View style={styles.pencilBadge}>
              <Ionicons name="pencil" size={16} color="#000000" />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileNameText}>{user?.fullName || 'ชื่อผู้ใช้งาน'}</Text>
          <Text style={styles.profileStudentIdText}>
            รหัสนักศึกษา {user?.studentId || 'B6802189'}
          </Text>
        </View>

        {/* 2. 3-Column Stats Card (Overlapping header) */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor }]}>
          <TouchableOpacity style={styles.statColumn} onPress={onOpenMyPosts} activeOpacity={0.7}>
            <Text style={[styles.statLabel, { color: colors.text }]}>โพสต์</Text>
            <Text style={[styles.statNumber, { color: colors.text }]}>{myLostCount}</Text>
          </TouchableOpacity>

          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity style={styles.statColumn} onPress={onOpenMyPosts} activeOpacity={0.7}>
            <Text style={[styles.statLabel, { color: colors.text }]}>พบของ</Text>
            <Text style={[styles.statNumber, { color: colors.text }]}>{myFoundCount}</Text>
          </TouchableOpacity>

          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity style={styles.statColumn} onPress={onOpenMyPosts} activeOpacity={0.7}>
            <Text style={[styles.statLabel, { color: colors.text }]}>ส่งคืน</Text>
            <Text style={[styles.statNumber, { color: colors.text }]}>{myReturnedCount}</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Menu List Options (ตรงตาม โปรไฟล์.png) */}
        <View style={styles.menuList}>
          {/* ประวัติการโพสต์ */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
            onPress={onOpenMyPosts}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="create-outline" size={26} color={colors.text} />
              <Text style={[styles.menuItemLabel, { color: colors.text }]}>ประวัติการโพสต์</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* รายการที่บันทึก (Favorites) */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
            onPress={onOpenFavorites}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="bookmark" size={26} color={colors.text} />
              <Text style={[styles.menuItemLabel, { color: colors.text }]}>รายการที่บันทึก</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* แดชบอร์ดสรุปสถิติ (Dashboard Shortcut) */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
            onPress={onOpenDashboard}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="bar-chart-outline" size={26} color={colors.text} />
              <Text style={[styles.menuItemLabel, { color: colors.text }]}>สถิติภาพรวม (Dashboard)</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* การตั้งค่า (Settings & Sensors) */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => setSettingsModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings-outline" size={26} color={colors.text} />
              <Text style={[styles.menuItemLabel, { color: colors.text }]}>การตั้งค่า</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* ช่วยเหลือ */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => {
              Alert.alert(
                'ศูนย์ช่วยเหลือ SUT Lost & Found',
                'ติดต่อผู้ดูแลระบบ: อาคารบริหาร มทส. หรือโทร 044-225-789\nเปิด Web Admin ที่ http://localhost:3000/admin'
              );
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={26} color={colors.text} />
              <Text style={[styles.menuItemLabel, { color: colors.text }]}>ช่วยเหลือ</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* ออกจากระบบ */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: 'transparent' }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out-outline" size={26} color={colors.text} />
              <Text style={[styles.menuItemLabel, { color: colors.text }]}>ออกจากระบบ</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ================= EDIT PROFILE MODAL (แก้ไขโปรไฟล์.png) ================= */}
      <Modal visible={editModalVisible} animationType="slide" transparent={false}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.blackCircleBtn}
              onPress={() => setEditModalVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>แก้ไขโปรไฟล์</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.editFormContent} showsVerticalScrollIndicator={false}>
            {/* Big Avatar with Pencil in Edit Screen */}
            <View style={styles.editAvatarCenter}>
              <View style={styles.editLargeAvatarCircle}>
                <Ionicons name="person" size={54} color="#FFFFFF" />
              </View>
              <View style={styles.editPencilBadge}>
                <Ionicons name="pencil" size={14} color="#000000" />
              </View>
            </View>

            {/* Field: ชื่อ */}
            <Text style={[styles.formLabel, { color: colors.text }]}>ชื่อ</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="ชื่อ-นามสกุล"
              placeholderTextColor="#94A3B8"
            />

            {/* Field: เบอร์โทรศัพท์ */}
            <Text style={[styles.formLabel, { color: colors.text }]}>เบอร์โทรศัพท์</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="08X-XXX-XXXX"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />

            {/* Field: คณะ */}
            <Text style={[styles.formLabel, { color: colors.text }]}>คณะ</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={faculty}
              onChangeText={setFaculty}
              placeholder="สำนักวิชา / สาขาวิชา"
              placeholderTextColor="#94A3B8"
            />

            {/* Field: อีเมล */}
            <Text style={[styles.formLabel, { color: colors.text }]}>อีเมล</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="example@g.sut.ac.th"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Orange Save Button */}
            <TouchableOpacity
              style={[styles.orangeSaveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveProfile}
              activeOpacity={0.88}
            >
              <Text style={styles.orangeSaveBtnText}>บันทึก</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ================= SETTINGS & SENSORS MODAL ================= */}
      <Modal visible={settingsModalVisible} animationType="slide" transparent={false}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.blackCircleBtn}
              onPress={() => setSettingsModalVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>การตั้งค่า</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.editFormContent}>
            {/* Dark Mode Switch */}
            <View style={[styles.settingRowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>โหมดมืด (Dark Theme)</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {isDark ? 'เปิดใช้งานอยู่' : 'ปิดใช้งานอยู่'}
                </Text>
              </View>
              <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#CBD5E1', true: colors.primary }} />
            </View>

            {/* LightSensor Switch */}
            <View style={[styles.settingRowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>เซ็นเซอร์วัดแสง (Light Sensor)</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {autoLightSensor
                    ? `ทำงานอยู่ ${currentLux !== null ? `(${Math.round(currentLux)} lux)` : ''} • สลับธีมอัตโนมัติ`
                    : 'ปิดอยู่'}
                </Text>
              </View>
              <Switch value={autoLightSensor} onValueChange={toggleAutoLightSensor} trackColor={{ false: '#CBD5E1', true: colors.success }} />
            </View>

            {/* Shake Sensor Info */}
            <View style={[styles.settingRowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>เขย่าเพื่อรีเฟรช (Accelerometer)</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  เขย่ามือถือในหน้าหลักเพื่อรีเฟรชข้อมูลโพสต์อัตโนมัติ
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            </View>
          </ScrollView>
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
    paddingBottom: 40,
  },
  orangeHeader: {
    paddingTop: 54,
    paddingBottom: 48,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  largeAvatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  pencilBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  profileNameText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  profileStudentIdText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -26,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginBottom: 24,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  menuList: {
    paddingHorizontal: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blackCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  editFormContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  editAvatarCenter: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  editLargeAvatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPencilBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 14,
  },
  formInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  orangeSaveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    elevation: 3,
  },
  orangeSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  settingRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
