import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

// =========================================================================
// 🔐 ระบบเข้าสู่ระบบและลงทะเบียน (Student ID Authentication Modal)
// =========================================================================
// 💡 อธิบายการทำงานแบบเข้าใจง่าย:
// ออกแบบเฉพาะสำหรับนักศึกษา มทส. (SUT) โดยไม่ต้องใช้อีเมล
// 
// 📌 มี 3 แท็บการใช้งาน:
// 1. "เข้าสู่ระบบ (Login)": กรอกรหัสนักศึกษา (เช่น B6803100) + รหัสผ่าน
// 2. "ลงทะเบียน (Register)": สำหรับนักศึกษาใหม่ กรอกชื่อ, รหัส, รหัสผ่าน, เบอร์โทร
// 3. "ลืมรหัสผ่าน (Forgot Password)": ส่งคำขอรีเซ็ตรหัสผ่านด้วยรหัสนักศึกษา
// =========================================================================

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { login, register } = useApp();
  const { colors, isDark } = useTheme();
  const [mode, setMode] = useState<AuthMode>('login'); // แท็บที่เลือกอยู่ (login/register/forgot)

  // Form States
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!studentId.trim()) {
      Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกรหัสนักศึกษา');
      return;
    }
    if (!password) {
      Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกรหัสผ่าน');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(studentId.trim(), password);
      Alert.alert('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับนักศึกษา รหัส ${studentId.trim().toUpperCase()}`);
      onClose();
    } catch (error: any) {
      const errMsg = error?.message || '';
      if (errMsg.includes('NOT_REGISTERED') || errMsg.includes('ไม่พบรหัสนักศึกษา')) {
        Alert.alert(
          '⚠️ ยังไม่ได้ลงทะเบียน',
          `ไม่พบรหัสนักศึกษา "${studentId.trim().toUpperCase()}" ในระบบ\nกรุณาลงทะเบียนก่อนเข้าใช้งานครั้งแรก`,
          [
            { text: 'ยกเลิก', style: 'cancel' },
            {
              text: 'ลงทะเบียนเดี๋ยวนี้',
              onPress: () => {
                setMode('register');
              },
            },
          ]
        );
      } else if (errMsg.includes('รหัสผ่านไม่ถูกต้อง')) {
        Alert.alert('รหัสผ่านไม่ถูกต้อง', 'กรุณาตรวจสอบรหัสผ่านใหม่อีกครั้ง');
      } else {
        Alert.alert('ข้อผิดพลาด', errMsg || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !studentId.trim() || !password.trim()) {
      Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อ-นามสกุล, รหัสนักศึกษา และรหัสผ่าน');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(fullName.trim(), studentId.trim(), password.trim(), phone.trim());
      Alert.alert(
        '🎉 ลงทะเบียนสำเร็จ',
        `สร้างบัญชีสำหรับ ${fullName} (${studentId.trim().toUpperCase()}) เรียบร้อยแล้ว`,
        [
          {
            text: 'เริ่มใช้งาน',
            onPress: onClose,
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('ข้อผิดพลาด', error?.message || 'ลงทะเบียนไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!studentId.trim()) {
      Alert.alert('กรุณาระบุข้อมูล', 'กรุณาระบุรหัสนักศึกษา');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.resetPassword(studentId.trim());
      Alert.alert('ส่งคำขอสำเร็จ', res.message, [
        { text: 'กลับไปหน้าเข้าสู่ระบบ', onPress: () => setMode('login') },
      ]);
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถส่งคำขอได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.modalBg }]}>
        <View style={[styles.header, { backgroundColor: colors.modalBg, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {mode === 'login'
              ? 'เข้าสู่ระบบ (SUT Login)'
              : mode === 'register'
                ? 'ลงทะเบียนนักศึกษาใหม่'
                : 'กู้คืนรหัสผ่าน (Reset Password)'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo Brand SUT */}
          <View style={styles.logoSection}>
            <View style={[styles.logoBadge, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
              <Ionicons name="shield-checkmark" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.brandTitle, { color: colors.primary }]}>SUT Lost and Found</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
              ระบบล็อกอินด้วยรหัสนักศึกษา (Student ID) และรหัสผ่าน
            </Text>
          </View>

          {/* Mode Switcher */}
          <View style={[styles.modeTabs, { backgroundColor: colors.surfaceAlt }]}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'login' && [styles.activeModeTab, { backgroundColor: colors.cardBg }]]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.modeTabText, { color: colors.textSecondary }, mode === 'login' && { color: colors.primary, fontWeight: '700' }]}>
                เข้าสู่ระบบ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === 'register' && [styles.activeModeTab, { backgroundColor: colors.cardBg }]]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.modeTabText, { color: colors.textSecondary }, mode === 'register' && { color: colors.primary, fontWeight: '700' }]}>
                ลงทะเบียน
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === 'forgot' && [styles.activeModeTab, { backgroundColor: colors.cardBg }]]}
              onPress={() => setMode('forgot')}
            >
              <Text style={[styles.modeTabText, { color: colors.textSecondary }, mode === 'forgot' && { color: colors.primary, fontWeight: '700' }]}>
                ลืมรหัสผ่าน
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: เข้าสู่ระบบ (LOGIN) */}
          {mode === 'login' && (
            <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  รหัสนักศึกษา (Student ID) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholderTextColor={colors.placeholder}
                  value={studentId}
                  onChangeText={setStudentId}
                  placeholder="เช่น B6802189"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  รหัสผ่าน (Password) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleLogin} disabled={isSubmitting}>
                <Text style={styles.submitBtnText}>
                  {isSubmitting ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
                </Text>
              </TouchableOpacity>

              <View style={styles.switchPrompt}>
                <Text style={[styles.switchPromptText, { color: colors.textSecondary }]}>ยังไม่มีบัญชีในระบบ? </Text>
                <TouchableOpacity onPress={() => setMode('register')}>
                  <Text style={[styles.switchPromptLink, { color: colors.primary }]}>ลงทะเบียนที่นี่</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 2: ลงทะเบียน (REGISTER) */}
          {mode === 'register' && (
            <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={[styles.infoBanner, { backgroundColor: colors.primaryBg }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.infoBannerText, { color: colors.primary }]}>
                  กรุณาลงทะเบียนข้อมูลนักศึกษาเพื่อเริ่มใช้งานระบบ
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Username <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholderTextColor={colors.placeholder}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Username"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  รหัสนักศึกษา (Student ID) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholderTextColor={colors.placeholder}
                  value={studentId}
                  onChangeText={setStudentId}
                  placeholder="เช่น B69XXXXX"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  ตั้งรหัสผ่าน (Password) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="รหัสผ่าน"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>เบอร์โทรศัพท์สำหรับติดต่อรับของ</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholderTextColor={colors.placeholder}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="เช่น 089-123-4567"
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleRegister} disabled={isSubmitting}>
                <Text style={styles.submitBtnText}>
                  {isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ลงทะเบียนสมาชิกใหม่'}
                </Text>
              </TouchableOpacity>

              <View style={styles.switchPrompt}>
                <Text style={[styles.switchPromptText, { color: colors.textSecondary }]}>มีบัญชีอยู่แล้ว? </Text>
                <TouchableOpacity onPress={() => setMode('login')}>
                  <Text style={[styles.switchPromptLink, { color: colors.primary }]}>เข้าสู่ระบบที่นี่</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 3: ลืมรหัสผ่าน (FORGOT) */}
          {mode === 'forgot' && (
            <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.forgotDesc, { color: colors.textSecondary }]}>
                กรุณาระบุรหัสนักศึกษาเพื่อส่งคำขอรีเซ็ตรหัสผ่าน
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>รหัสนักศึกษา (Student ID)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholderTextColor={colors.placeholder}
                  value={studentId}
                  onChangeText={setStudentId}
                  placeholder="เช่น B6802189"
                  autoCapitalize="characters"
                />
              </View>

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleForgotPassword} disabled={isSubmitting}>
                <Text style={styles.submitBtnText}>ส่งคำขอรีเซ็ตรหัสผ่าน</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  brandSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  modeTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeModeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
    marginBottom: 14,
  },
  infoBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  forgotDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  submitBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  switchPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  switchPromptText: {
    fontSize: 12,
  },
  switchPromptLink: {
    fontSize: 12,
    fontWeight: '700',
  },
});
