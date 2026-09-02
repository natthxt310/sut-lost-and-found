import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { moderateUserName } from '../services/moderation';

/**
 * =========================================================================
 * 🔐 หน้าต่างเข้าสู่ระบบ & ลงทะเบียนสมาชิก (Auth Modal - Login & Register)
 * =========================================================================
 * 💡 ฟีเจอร์:
 * 1. สลับแท็บ เข้าสู่ระบบ / ลงทะเบียน
 * 2. หน้าลงทะเบียนมีช่องกรอก: ชื่อ-นามสกุล, รหัสนักศึกษา, อีเมล, ตั้งรหัสผ่าน, ยืนยันรหัสผ่าน
 * 3. ระบบตรวจจับและแบนคำไม่เหมาะสมในชื่อ (Name Moderation)
 * 4. ห้ามปิดหรือข้ามหน้าต่างนี้หากยังไม่ได้เข้าสู่ระบบ (allowDismiss: false)
 * 5. Placeholder กระชับ คลีน ไม่มีคำว่า "เช่น"
 * =========================================================================
 */

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  allowDismiss?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  initialMode = 'login',
  allowDismiss = true,
}) => {
  const { login, register } = useApp();
  const { colors, isDark } = useTheme();

  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);

  // Login States
  const [loginStudentId, setLoginStudentId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register States
  const [regFullName, setRegFullName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Auto-fill student email when studentId changes
  const handleRegStudentIdChange = (text: string) => {
    setRegStudentId(text);
    const clean = text.trim().toLowerCase();
    if (clean) {
      setRegEmail(`${clean}@g.sut.ac.th`);
    } else {
      setRegEmail('');
    }
  };

  const handleLogin = async () => {
    if (!loginStudentId.trim()) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดระบุรหัสนักศึกษา');
      return;
    }
    if (!loginPassword) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดระบุรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    try {
      await login(loginStudentId.trim().toUpperCase(), loginPassword);
      Alert.alert('เข้าสู่ระบบสำเร็จ! 👋', `ยินดีต้อนรับรหัสนักศึกษา ${loginStudentId.trim().toUpperCase()}`);
      onClose();
    } catch (e: any) {
      if (e.message && e.message.startsWith('NOT_REGISTERED:')) {
        Alert.alert('ยังไม่ได้ลงทะเบียน', e.message.replace('NOT_REGISTERED:', ''), [
          { text: 'ยกเลิก', style: 'cancel' },
          {
            text: 'ลงทะเบียนตอนนี้',
            onPress: () => {
              setRegStudentId(loginStudentId.trim().toUpperCase());
              setRegEmail(`${loginStudentId.trim().toLowerCase()}@g.sut.ac.th`);
              setAuthMode('register');
            },
          },
        ]);
      } else {
        Alert.alert('เข้าสู่ระบบไม่สำเร็จ', e.message || 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    const fullName = regFullName.trim();
    const sId = regStudentId.trim().toUpperCase();
    const email = regEmail.trim();
    const pwd = regPassword;
    const confirmPwd = regConfirmPassword;

    if (!fullName) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดระบุชื่อ-นามสกุล หรือชื่อผู้ใช้งาน');
      return;
    }

    // 🛡️ ตรวจสอบคำไม่เหมาะสมในชื่อ (Name Moderation)
    const nameCheck = moderateUserName(fullName);
    if (!nameCheck.isSafe) {
      Alert.alert(
        'ชื่อไม่เหมาะสม ⚠️',
        nameCheck.reason || 'ตรวจพบคำไม่เหมาะสมในชื่อ กรุณาใช้ชื่อที่สุภาพ'
      );
      return;
    }

    if (!sId) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดระบุรหัสนักศึกษา');
      return;
    }
    if (!email) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดระบุอีเมล');
      return;
    }
    if (!pwd) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดตั้งรหัสผ่าน');
      return;
    }
    if (pwd.length < 4) {
      Alert.alert('รหัสผ่านสั้นเกินไป', 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (pwd !== confirmPwd) {
      Alert.alert('รหัสผ่านไม่ตรงกัน', 'กรุณากรอกยืนยันรหัสผ่านให้ตรงกับรหัสผ่านที่ตั้งไว้');
      return;
    }

    setIsLoading(true);
    try {
      await register(sId, email, pwd, fullName);
      Alert.alert(
        'ลงทะเบียนสำเร็จ! 🎉',
        `ยินดีต้อนรับ ${fullName} (รหัสนักศึกษา ${sId}) ได้รับการลงทะเบียนเรียบร้อยแล้ว`,
        [{ text: 'เริ่มใช้งาน', onPress: onClose }]
      );
    } catch (e: any) {
      Alert.alert('ลงทะเบียนไม่สำเร็จ', e.message || 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const target = (loginStudentId || regStudentId).trim().toLowerCase();
    Alert.alert(
      'กู้คืนรหัสผ่าน (Password Recovery)',
      `ระบบจะส่งลิงก์สำหรับตั้งค่ารหัสผ่านใหม่ไปยังอีเมลนักศึกษา: ${target ? `${target}@g.sut.ac.th` : 'your_email@g.sut.ac.th'}`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ส่งอีเมลรีเซ็ต',
          onPress: () => Alert.alert('สำเร็จ', 'ส่งคำขอรีเซ็ตรหัสผ่านไปยังอีเมลนักศึกษาเรียบร้อยแล้ว'),
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: isDark ? colors.background : '#FFFFFF' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Close Button on Top Left (แสดงเฉพาะเมื่ออนุญาตให้ปิดได้) */}
          {allowDismiss ? (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Ionicons name="close" size={26} color={isDark ? colors.text : '#64748B'} />
            </TouchableOpacity>
          ) : (
            <View style={{ height: 20 }} />
          )}

          {/* SUT Brand Logo (ส้ม มทส. พร้อมลูกศรเฉียงขวาบน) */}
          <View style={styles.logoContainer}>
            <View style={styles.logoRow}>
              <Text style={styles.sutText}>SUT</Text>
              {/* Arrow Up-Right Element */}
              <View style={styles.arrowBox}>
                <View style={styles.arrowTop} />
                <View style={styles.arrowRight} />
              </View>
            </View>
            <Text style={[styles.appSubTitle, { color: isDark ? colors.textSecondary : '#64748B' }]}>
              LOST & FOUND SYSTEM
            </Text>
          </View>

          {/* Mode Tabs: เข้าสู่ระบบ / ลงทะเบียน */}
          <View style={[styles.tabContainer, { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                authMode === 'login' && {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                },
              ]}
              onPress={() => setAuthMode('login')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  authMode === 'login'
                    ? { color: '#FF7A00', fontWeight: '800' }
                    : { color: isDark ? colors.textSecondary : '#64748B' },
                ]}
              >
                เข้าสู่ระบบ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                authMode === 'register' && {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                },
              ]}
              onPress={() => setAuthMode('register')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  authMode === 'register'
                    ? { color: '#FF7A00', fontWeight: '800' }
                    : { color: isDark ? colors.textSecondary : '#64748B' },
                ]}
              >
                ลงทะเบียน
              </Text>
            </TouchableOpacity>
          </View>

          {/* =========================================================================
              FORM: เข้าสู่ระบบ (LOGIN)
             ========================================================================= */}
          {authMode === 'login' && (
            <View style={styles.formContainer}>
              {/* Input 1: รหัสนักศึกษา */}
              <View style={styles.inputContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>รหัสนักศึกษา</Text>
                <TextInput
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: isDark ? colors.border : '#CBD5E1',
                      color: colors.text,
                    },
                  ]}
                  placeholder="รหัสนักศึกษา"
                  placeholderTextColor="#94A3B8"
                  value={loginStudentId}
                  onChangeText={setLoginStudentId}
                  autoCapitalize="characters"
                />
              </View>

              {/* Input 2: รหัสผ่าน with Eye Icon */}
              <View style={styles.inputContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>รหัสผ่าน</Text>
                <View
                  style={[
                    styles.passwordBox,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: isDark ? colors.border : '#CBD5E1',
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.passwordInput, { color: colors.text }]}
                    placeholder="รหัสผ่าน"
                    placeholderTextColor="#94A3B8"
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry={!showLoginPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowLoginPassword(!showLoginPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showLoginPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me & Forgot Password Row */}
              <View style={styles.rememberAndForgotRow}>
                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxActive,
                      { borderColor: rememberMe ? '#FF7A00' : (isDark ? colors.border : '#CBD5E1') },
                    ]}
                  >
                    {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.rememberText, { color: isDark ? colors.textSecondary : '#64748B' }]}>
                    จดจำผู้ใช้
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
                  <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
                </TouchableOpacity>
              </View>

              {/* Orange Login Button */}
              <TouchableOpacity
                style={styles.orangeSubmitBtn}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.88}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.orangeSubmitBtnText}>เข้าสู่ระบบ</Text>
                )}
              </TouchableOpacity>

              {/* Toggle to Register */}
              <View style={styles.switchAuthRow}>
                <Text style={[styles.switchAuthText, { color: isDark ? colors.textSecondary : '#64748B' }]}>
                  ยังไม่มีบัญชีใช่หรือไม่?{' '}
                </Text>
                <TouchableOpacity onPress={() => setAuthMode('register')} activeOpacity={0.7}>
                  <Text style={styles.switchAuthLink}>ลงทะเบียนใหม่</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* =========================================================================
              FORM: ลงทะเบียน (REGISTER - รวมช่องตั้งชื่อ)
             ========================================================================= */}
          {authMode === 'register' && (
            <View style={styles.formContainer}>
              {/* Field 1: ชื่อ-นามสกุล / ชื่อผู้ใช้งาน */}
              <View style={styles.inputContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  1. ชื่อ-นามสกุล / ชื่อผู้ใช้งาน <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: isDark ? colors.border : '#CBD5E1',
                      color: colors.text,
                    },
                  ]}
                  placeholder="ชื่อ-นามสกุล หรือชื่อที่ใช้แสดง"
                  placeholderTextColor="#94A3B8"
                  value={regFullName}
                  onChangeText={setRegFullName}
                />
              </View>

              {/* Field 2: รหัสนักศึกษา */}
              <View style={styles.inputContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  2. รหัสนักศึกษา <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: isDark ? colors.border : '#CBD5E1',
                      color: colors.text,
                    },
                  ]}
                  placeholder="รหัสนักศึกษา"
                  placeholderTextColor="#94A3B8"
                  value={regStudentId}
                  onChangeText={handleRegStudentIdChange}
                  autoCapitalize="characters"
                />
              </View>

              {/* Field 3: อีเมล */}
              <View style={styles.inputContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  3. อีเมลนักศึกษา <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: isDark ? colors.border : '#CBD5E1',
                      color: colors.text,
                    },
                  ]}
                  placeholder="อีเมลนักศึกษา"
                  placeholderTextColor="#94A3B8"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Field 4: ตั้งรหัสผ่าน */}
              <View style={styles.inputContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  4. ตั้งรหัสผ่าน <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.passwordBox,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: isDark ? colors.border : '#CBD5E1',
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.passwordInput, { color: colors.text }]}
                    placeholder="รหัสผ่าน"
                    placeholderTextColor="#94A3B8"
                    value={regPassword}
                    onChangeText={setRegPassword}
                    secureTextEntry={!showRegPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowRegPassword(!showRegPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showRegPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field 5: ยืนยันตั้งรหัสผ่าน */}
              <View style={styles.inputContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  5. ยืนยันตั้งรหัสผ่าน <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.passwordBox,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: isDark ? colors.border : '#CBD5E1',
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.passwordInput, { color: colors.text }]}
                    placeholder="ยืนยันรหัสผ่าน"
                    placeholderTextColor="#94A3B8"
                    value={regConfirmPassword}
                    onChangeText={setRegConfirmPassword}
                    secureTextEntry={!showRegConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showRegConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Orange Register Button */}
              <TouchableOpacity
                style={styles.orangeSubmitBtn}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.88}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.orangeSubmitBtnText}>ลงทะเบียนสมาชิก</Text>
                )}
              </TouchableOpacity>

              {/* Toggle to Login */}
              <View style={styles.switchAuthRow}>
                <Text style={[styles.switchAuthText, { color: isDark ? colors.textSecondary : '#64748B' }]}>
                  มีบัญชีอยู่แล้วใช่หรือไม่?{' '}
                </Text>
                <TouchableOpacity onPress={() => setAuthMode('login')} activeOpacity={0.7}>
                  <Text style={styles.switchAuthLink}>เข้าสู่ระบบ</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* SUT Building Silhouette Footer Illustration */}
          <View style={styles.silhouetteContainer}>
            <View style={styles.towerShape} />
            <View style={styles.mainBuildingShape} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 50,
    paddingBottom: 40,
    minHeight: '100%',
  },
  closeBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sutText: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FF7A00',
    letterSpacing: -2,
    lineHeight: 70,
  },
  arrowBox: {
    width: 22,
    height: 22,
    marginLeft: 4,
    marginTop: 4,
    position: 'relative',
  },
  arrowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: '#FF7A00',
  },
  arrowRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 5,
    backgroundColor: '#FF7A00',
  },
  appSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  formContainer: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputBox: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  passwordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  rememberAndForgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#FF7A00',
    borderColor: '#FF7A00',
  },
  rememberText: {
    fontSize: 13,
    fontWeight: '500',
  },
  forgotText: {
    color: '#FF7A00',
    fontSize: 13,
    fontWeight: '700',
  },
  orangeSubmitBtn: {
    height: 50,
    backgroundColor: '#FF7A00',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    marginTop: 6,
  },
  orangeSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  switchAuthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  switchAuthText: {
    fontSize: 13,
    fontWeight: '500',
  },
  switchAuthLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF7A00',
  },
  silhouetteContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    opacity: 0.08,
    pointerEvents: 'none',
  },
  towerShape: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    width: 26,
    height: 70,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#64748B',
  },
  mainBuildingShape: {
    position: 'absolute',
    bottom: 0,
    left: 54,
    right: 20,
    height: 44,
    backgroundColor: '#64748B',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
});
