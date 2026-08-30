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

/**
 * =========================================================================
 * 🔐 หน้าต่างเข้าสู่ระบบ (Auth / Login Screen - ตามแบบ ลอกอิน.png)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. โลโก้ SUT สีส้ม
 * 2. ช่องกรอกรหัสนักศึกษา และรหัสผ่าน (พร้อมปุ่มเปิด/ปิดตา)
 * 3. ตัวเลือก 'จดจำผู้ใช้'
 * 4. ปุ่มส้ม 'เข้าสู่ระบบ', ปุ่ม 'Login with Google', ลิงก์ 'ลืมรหัสผ่าน?'
 * =========================================================================
 */

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { login, register } = useApp();
  const { colors, isDark } = useTheme();

  const [studentId, setStudentId] = useState('B6802189');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!studentId.trim()) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดระบุรหัสนักศึกษา (เช่น B6802189)');
      return;
    }

    setIsLoading(true);
    try {
      await login(studentId.trim().toUpperCase(), password);
      onClose();
    } catch {
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await login('B6802189', 'google-auth');
      onClose();
    } catch {
      //
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'กู้คืนรหัสผ่าน (Password Recovery)',
      `ระบบจะส่งรหัส OTP สำหรับตั้งค่ารหัสผ่านใหม่ไปยังอีเมลนักศึกษา: ${studentId ? studentId.toLowerCase() : 'student'}@g.sut.ac.th`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ส่งอีเมลรีเซ็ต',
          onPress: () => Alert.alert('สำเร็จ', 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลนักศึกษาเรียบร้อยแล้ว'),
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: '#FFFFFF' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Close Button on Top Left */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>

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
          </View>

          {/* Input 1: รหัสนักศึกษา */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputBox}
              placeholder="รหัสนักศึกษา"
              placeholderTextColor="#94A3B8"
              value={studentId}
              onChangeText={setStudentId}
              autoCapitalize="characters"
            />
          </View>

          {/* Input 2: รหัสผ่าน with Eye Icon */}
          <View style={styles.inputContainer}>
            <View style={styles.passwordBox}>
              <TextInput
                style={styles.passwordInput}
                placeholder="รหัสผ่าน"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me Checkbox */}
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.rememberText}>จดจำผู้ใช้</Text>
          </TouchableOpacity>

          {/* Orange Login Button */}
          <TouchableOpacity
            style={styles.orangeLoginBtn}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.orangeLoginBtnText}>เข้าสู่ระบบ</Text>
            )}
          </TouchableOpacity>

          {/* Or Login With Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>หรือเข้าสู่ระบบด้วย</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Login with Google Button */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            activeOpacity={0.85}
          >
            <View style={styles.googleGLogo}>
              <Text style={styles.googleGText}>G</Text>
            </View>
            <Text style={styles.googleBtnText}>Login with Google</Text>
          </TouchableOpacity>

          {/* Forgot Password Link */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn} activeOpacity={0.7}>
            <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
          </TouchableOpacity>

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
    paddingTop: 54,
    paddingBottom: 20,
    minHeight: '100%',
  },
  closeBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 44,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sutText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FF7A00',
    letterSpacing: -2,
    lineHeight: 78,
  },
  arrowBox: {
    width: 24,
    height: 24,
    marginLeft: 4,
    marginTop: 4,
    position: 'relative',
  },
  arrowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#FF7A00',
  },
  arrowRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 6,
    backgroundColor: '#FF7A00',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputBox: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
  },
  passwordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#FF7A00',
    borderColor: '#FF7A00',
  },
  rememberText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  orangeLoginBtn: {
    height: 50,
    backgroundColor: '#FF7A00',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  orangeLoginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  googleGLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EA4335',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleGText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  forgotBtn: {
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  forgotText: {
    color: '#0055D4',
    fontSize: 13,
    fontWeight: '700',
  },
  silhouetteContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    opacity: 0.12,
    pointerEvents: 'none',
  },
  towerShape: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    width: 30,
    height: 80,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: '#64748B',
  },
  mainBuildingShape: {
    position: 'absolute',
    bottom: 0,
    left: 60,
    right: 20,
    height: 50,
    backgroundColor: '#64748B',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
});
