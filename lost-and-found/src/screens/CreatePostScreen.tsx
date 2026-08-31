import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SUTDropdown } from '../components/SUTDropdown';
import { SUTDateTimePickerModal } from '../components/SUTDateTimePickerModal';
import { CATEGORY_DROPDOWN_OPTIONS, SUT_CATEGORIES } from '../data/categoriesData';
import { ALL_SUT_LOCATION_NAMES } from '../data/locationsData';
import { PostType } from '../types';

/**
 * =========================================================================
 * 📝 หน้าสร้างโพสต์แจ้งของหาย / พบของ (Create Post Screen - ตามแบบ โพสต์.png)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. สลับประเภท 'ของหาย' (สีแดง) หรือ 'ของที่พบ' (สีเขียว)
 * 2. กรอบเส้นประอัปโหลดรูปภาพสิ่งของ
 * 3. หมวดหมู่และแท็กที่ละเอียดครบทุกหมวดใน มทส.
 * 4. เลือกวันที่แบบ Calendar ปฏิทินภาษาไทย และเลือกเวลาแบบ Time Picker (ไม่ต้องพิมพ์เอง)
 * 5. ปุ่มส้ม "โพสต์" บันทึกข้อมูลขึ้นระบบและค้นหา Auto-Match ทันที
 * =========================================================================
 */

interface CreatePostScreenProps {
  initialType?: PostType;
  onBack: () => void;
  onSuccess: () => void;
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  initialType = 'lost',
  onBack,
  onSuccess,
}) => {
  const { createPost, user } = useApp();
  const { colors, isDark } = useTheme();

  const [type, setType] = useState<PostType>(initialType);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  
  // Date & Time States
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`;
  });
  const [time, setTime] = useState(() => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Picker Modals States
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  // เลือกรูปภาพจากคลังภาพ
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('ต้องการสิทธิ์การเข้าถึงกล้อง', 'กรุณาอนุญาตการเข้าถึงกล้องถ่ายรูป');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUrl(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปิดกล้องถ่ายรูปได้');
    }
  };

  const handleImageChoice = () => {
    Alert.alert('อัปโหลดรูปภาพ', 'เลือกช่องทางอัปโหลดรูปสิ่งของ', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'เปิดกล้องถ่ายภาพ 📷',
        onPress: takePhoto,
      },
      {
        text: 'เลือกจากคลังภาพ 🖼️',
        onPress: pickImage,
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดระบุชื่อสิ่งของ');
      return;
    }
    if (!category) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดเลือกหมวดหมู่สิ่งของ');
      return;
    }
    if (!location) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดเลือกสถานที่ใน มทส.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost({
        type,
        title: title.trim(),
        category,
        color: 'ไม่ระบุ',
        location,
        dateTime: `${date} ${time}`,
        description: description.trim(),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
        status: type === 'lost' ? 'lost' : 'found',
        userId: user?.id || 'usr-001',
        userName: user?.fullName || 'ศิวะพร ภูดินทราย',
        userContact: user?.phone || '089-123-4567',
        userEmail: user?.email || 'b6802189@g.sut.ac.th',
      });

      Alert.alert('โพสต์สำเร็จ! 🎉', 'ข้อมูลสิ่งของของคุณถูกบันทึกขึ้นระบบเรียบร้อยแล้ว', [
        {
          text: 'ตกลง',
          onPress: onSuccess,
        },
      ]);
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างโพสต์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const locations = ALL_SUT_LOCATION_NAMES;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.blackCircleBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>โพสต์</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. ประเภท (Type Selector) */}
        <Text style={[styles.label, { color: colors.text }]}>ประเภท</Text>
        <View style={styles.typeSelectorRow}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              type === 'lost'
                ? { backgroundColor: '#EF4444' }
                : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
            ]}
            onPress={() => setType('lost')}
            activeOpacity={0.85}
          >
            <Text style={[styles.typeBtnText, type === 'lost' ? styles.typeBtnTextActive : { color: colors.text }]}>
              ของหาย
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeBtn,
              type === 'found'
                ? { backgroundColor: '#10B981' }
                : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
            ]}
            onPress={() => setType('found')}
            activeOpacity={0.85}
          >
            <Text style={[styles.typeBtnText, type === 'found' ? styles.typeBtnTextActive : { color: colors.text }]}>
              ของที่พบ
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. รูปภาพ (Upload Box with Dashed Border) */}
        <Text style={[styles.label, { color: colors.text }]}>รูปภาพ</Text>
        <TouchableOpacity
          style={[
            styles.imageUploadBox,
            { borderColor: isDark ? '#475569' : '#CBD5E1', backgroundColor: colors.surface },
          ]}
          onPress={handleImageChoice}
          activeOpacity={0.8}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="camera" size={38} color={colors.text} />
              <Text style={[styles.uploadText, { color: colors.text }]}>อัปโหลดรูปภาพ</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 3. ชื่อ */}
        <Text style={[styles.label, { color: colors.text }]}>ชื่อสิ่งของ</Text>
        <TextInput
          style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="เช่น iPhone 13 สีดำ, กุญแจรถ Honda Wave"
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />

        {/* 4. หมวดหมู่แบบละเอียด */}
        <Text style={[styles.label, { color: colors.text }]}>หมวดหมู่</Text>
        <SUTDropdown
          label=""
          items={CATEGORY_DROPDOWN_OPTIONS}
          selectedValue={category}
          onSelect={setCategory}
          placeholder="เลือกหมวดหมู่สิ่งของ (เช่น โทรศัพท์, บัตร, กุญแจ)"
        />

        {/* 5. สถานที่ */}
        <Text style={[styles.label, { color: colors.text }]}>สถานที่</Text>
        <SUTDropdown
          label=""
          items={locations}
          selectedValue={location}
          onSelect={setLocation}
          placeholder="เลือกสถานที่ใน มทส."
        />

        {/* 6. วันที่ & เวลา (Interactive Calendar & Time Buttons) */}
        <View style={styles.dateTimeRow}>
          {/* Calendar Date Picker Button */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.text }]}>วันที่</Text>
            <TouchableOpacity
              style={[styles.inputBoxWithIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setPickerMode('date')}
              activeOpacity={0.85}
            >
              <Text style={[styles.pickerValueText, { color: colors.text }]}>
                {date || 'เลือกวันที่'}
              </Text>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Time Picker Button */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.text }]}>เวลา</Text>
            <TouchableOpacity
              style={[styles.inputBoxWithIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setPickerMode('time')}
              activeOpacity={0.85}
            >
              <Text style={[styles.pickerValueText, { color: colors.text }]}>
                {time ? `${time} น.` : 'เลือกเวลา'}
              </Text>
              <Ionicons name="time" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. รายละเอียด */}
        <Text style={[styles.label, { color: colors.text }]}>รายละเอียด</Text>
        <TextInput
          style={[
            styles.inputBox,
            styles.textArea,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="ระบุจุดสังเกต, เคส, สติกเกอร์ หรือรายละเอียดเพิ่มเติม..."
          placeholderTextColor="#94A3B8"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        {/* Orange Submit Button */}
        <TouchableOpacity
          style={[styles.orangeSubmitBtn, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.88}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.orangeSubmitBtnText}>โพสต์</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ================= SUT DATE / TIME PICKER MODAL ================= */}
      {pickerMode && (
        <SUTDateTimePickerModal
          visible={!!pickerMode}
          mode={pickerMode}
          currentValue={pickerMode === 'date' ? date : time}
          onConfirm={(val) => {
            if (pickerMode === 'date') setDate(val);
            else setTime(val);
          }}
          onClose={() => setPickerMode(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 14,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  imageUploadBox: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '700',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  inputBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  inputBoxWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  pickerValueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  textArea: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  orangeSubmitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  orangeSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
