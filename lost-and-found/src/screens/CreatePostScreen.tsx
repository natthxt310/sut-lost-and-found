import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { CameraCapture } from '../components/CameraCapture';
import { SUTDropdown } from '../components/SUTDropdown';
import { moderatePostContent } from '../services/moderation';
import { PostType, SUT_LOCATIONS, ITEM_CATEGORIES, ITEM_COLORS } from '../types';

// =========================================================================
// 📝 หน้าสร้างโพสต์ (Create Post Screen)
// =========================================================================
// 💡 อธิบายการทำงานแบบเข้าใจง่าย:
// ใช้สำหรับสร้างโพสต์ใหม่ แบ่งออกเป็น 2 แบบ:
// 1. "ฉันทำของหาย (Lost)"  => ใส่ข้อมูลของที่หาย เพื่อให้คนอื่นช่วยตามหา
// 2. "ฉันเก็บของได้ (Found)" => ใส่ข้อมูลของที่เก็บได้ พร้อมคำถามกันคนแอบอ้าง (Security Question)
//
// 🛡️ ระบบความปลอดภัยที่มีในหน้านี้:
// - กล้องถ่ายรูป: ถ่ายภาพจริงผ่านเซนเซอร์กล้องมือถือ
// - AI กรองคำหยาบ: ตรวจสอบข้อความก่อนบันทึก ถ้ามีคำหยาบจะไม่อนุญาตให้โพสต์
// - Auto-Match: ทันทีที่โพสต์เสร็จ ระบบจะคำนวณจับคู่กับโพสต์ที่มีทันที ถ้าตรงจะเด้งเตือน!
// =========================================================================

interface CreatePostScreenProps {
  initialType?: PostType;
  onSuccess: () => void;
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  initialType = 'lost',
  onSuccess,
}) => {
  const { user, createPost } = useApp();
  const { colors, isDark } = useTheme();

  // สถานะข้อมูลของฟอร์ม (Form States)
  const [type, setType] = useState<PostType>(initialType); // 'lost' หรือ 'found'
  const [title, setTitle] = useState('');                   // ชื่อสิ่งของ
  const [category, setCategory] = useState(ITEM_CATEGORIES[0]); // หมวดหมู่
  const [color, setColor] = useState(ITEM_COLORS[0]);           // สี
  const [location, setLocation] = useState(SUT_LOCATIONS[0]);   // พิกัดสถานที่ใน มทส.
  const [dateTime, setDateTime] = useState(
    new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [description, setDescription] = useState('');       // รายละเอียดเพิ่มเติม
  const [imageUrl, setImageUrl] = useState('');             // รูปภาพ
  const [userContact, setUserContact] = useState(user ? `Line: ${user.studentId} / โทร ${user.phone}` : ''); // ช่องทางติดต่อ
  const [securityQuestion, setSecurityQuestion] = useState(''); // คำถามพิสูจน์เจ้าของ
  const [isSubmitting, setIsSubmitting] = useState(false);  // สถานะกำลังโหลดตอนกดบันทึก

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('กรุณากรอกข้อมูล', 'กรุณาระบุชื่อสิ่งของที่ต้องการโพสต์');
      return;
    }
    if (!userContact.trim()) {
      Alert.alert('กรุณากรอกข้อมูล', 'กรุณาระบุช่องทางการติดต่อสำหรับส่งคืน');
      return;
    }

    // 🛡️ AI Automated Content Safety & Moderation Check
    const modResult = moderatePostContent(title.trim(), description.trim(), imageUrl);
    if (modResult.status === 'rejected') {
      Alert.alert(
        '🚫 ตรวจพบคำไม่เหมาะสม',
        modResult.reason || 'กรุณาตรวจสอบและใช้ถ้อยคำที่สุภาพเหมาะสมสำหรับพื้นที่สาธารณะ'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createPost({
        type,
        title: title.trim(),
        category,
        color,
        location,
        dateTime,
        description: description.trim(),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
        status: type === 'lost' ? 'lost' : 'found',
        userId: user?.id || 'usr-anon',
        userName: user?.fullName || 'นักศึกษา มทส.',
        userContact: userContact.trim(),
        userEmail: user?.email || 'student@g.sut.ac.th',
        securityQuestion: securityQuestion.trim() || undefined,
        isApproved: modResult.status === 'approved',
        moderationStatus: modResult.status,
        moderationScore: modResult.score,
        moderationNotes: modResult.reason,
      });

      if (result.matches.length > 0) {
        Alert.alert(
          '🎉 ตรวจพบการจับคู่อัตโนมัติ (Auto-Match)!',
          `ระบบตรวจพบโพสต์ที่มีข้อมูลตรงกัน ${result.matches.length} รายการ!\nกรุณาตรวจสอบที่แท็บการแจ้งเตือนเพื่อดูข้อมูลผู้ติดต่อ`,
          [{ text: 'ตกลง', onPress: onSuccess }]
        );
      } else {
        Alert.alert(
          'สำเร็จ',
          modResult.status === 'approved'
            ? '✅ บันทึกโพสต์เรียบร้อย (ผ่านการตรวจสอบความปลอดภัย AI อัตโนมัติ)'
            : '⚠️ บันทึกโพสต์เรียบร้อย (ส่งให้ผู้ดูแลระบบตรวจสอบเพิ่มเติม)',
          [{ text: 'ตกลง', onPress: onSuccess }]
        );
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกโพสต์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.modalBg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Toggle ประเภทโพสต์ */}
        <View style={[styles.typeSelectorContainer, { backgroundColor: colors.surfaceAlt }]}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'lost' && styles.typeBtnLostActive]}
            onPress={() => setType('lost')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="search"
              size={18}
              color={type === 'lost' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text style={[styles.typeBtnText, { color: colors.textSecondary }, type === 'lost' && styles.typeBtnTextActive]}>
              ฉันทำของหาย (Lost)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeBtn, type === 'found' && styles.typeBtnFoundActive]}
            onPress={() => setType('found')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="camera"
              size={18}
              color={type === 'found' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text style={[styles.typeBtnText, { color: colors.textSecondary }, type === 'found' && styles.typeBtnTextActive]}>
              ฉันเก็บของได้ (Found)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Camera Sensor Integration */}
        <CameraCapture imageUri={imageUrl} onImageChange={setImageUrl} />

        {/* ฟิลด์ชื่อสิ่งของ */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            ชื่อสิ่งของ <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
            placeholderTextColor={colors.placeholder}
            placeholder={type === 'lost' ? 'เช่น กุญแจรถฮอนด้าเวฟ, หูฟัง AirPods...' : 'เช่น บัตรนักศึกษา, กระเป๋าสตางค์...'}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Dropdown หมวดหมู่และสี */}
        <SUTDropdown
          label="หมวดหมู่สิ่งของ (Category Tag)"
          items={ITEM_CATEGORIES}
          selectedValue={category}
          onSelect={setCategory}
          iconName="pricetag-outline"
        />

        <SUTDropdown
          label="สีของสิ่งของ (Color Tag)"
          items={ITEM_COLORS}
          selectedValue={color}
          onSelect={setColor}
          iconName="color-palette-outline"
        />

        {/* Dropdown พิกัดสถานที่ใน มทส. */}
        <SUTDropdown
          label="พิกัดสถานที่ใน มทส. (SUT Campus Location)"
          items={SUT_LOCATIONS}
          selectedValue={location}
          onSelect={setLocation}
          iconName="location-outline"
        />

        {/* วันและเวลา */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>วันและเวลาที่ทำหาย/พบ</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
            placeholderTextColor={colors.placeholder}
            value={dateTime}
            onChangeText={setDateTime}
            placeholder="ระบุวันเวลา เช่น 23 ส.ค. 2569 10:00"
          />
        </View>

        {/* รายละเอียดเพิ่มเติม */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>รายละเอียดและจุดสังเกต</Text>
          <TextInput
            style={[styles.textInput, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
            placeholderTextColor={colors.placeholder}
            placeholder="ระบุจุดสังเกตเพิ่มเติม เช่น มีสติกเกอร์แปะ มีรอยขีดข่วน หรือบริเวณที่ทำตก..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* ช่องทางติดต่อ */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            ช่องทางการติดต่อ <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
            placeholderTextColor={colors.placeholder}
            placeholder="เช่น Line ID, เบอร์โทรศัพท์, Facebook..."
            value={userContact}
            onChangeText={setUserContact}
          />
        </View>

        {/* คำถามยืนยันความเป็นเจ้าของ (สำหรับคนเจอของ) */}
        {type === 'found' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              คำถามเพื่อพิสูจน์ความเป็นเจ้าของ (Security Question - ป้องกันการสวมรอย)
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
              placeholderTextColor={colors.placeholder}
              placeholder="เช่น ข้างในกระเป๋ามีเหรียญอะไร, หน้าจอมือถือรูปลูกอะไร..."
              value={securityQuestion}
              onChangeText={setSecurityQuestion}
            />
          </View>
        )}

        {/* ปุ่มบันทึก */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }, isSubmitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {type === 'lost' ? 'เผยแพร่ประกาศของหาย' : 'บันทึกรายการที่พบ'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 6,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  typeBtnLostActive: {
    backgroundColor: '#EF4444',
  },
  typeBtnFoundActive: {
    backgroundColor: '#10B981',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
