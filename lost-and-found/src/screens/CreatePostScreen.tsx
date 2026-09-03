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
import { CATEGORY_DROPDOWN_OPTIONS, SUT_CATEGORIES, SUT_COLOR_OPTIONS } from '../data/categoriesData';
import { ALL_SUT_LOCATION_NAMES } from '../data/locationsData';
import { PostType, PostItem } from '../types';

/**
 * =========================================================================
 * 📝 หน้าสร้างโพสต์แจ้งของหาย / พบของ (Create Post Screen - ตามแบบ โพสต์.png)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. สลับประเภท 'ของหาย' (สีแดง) หรือ 'ของที่พบ' (สีเขียว)
 * 2. กรอบเส้นประอัปโหลดรูปภาพสิ่งของ
 * 3. หมวดหมู่และแท็กที่ละเอียดครบทุกหมวดใน มทส.
 * 4. เลือกสี / โทนสีของสิ่งของ (Palette Chips)
 * 5. เลือกวันที่แบบ Calendar ปฏิทินภาษาไทย และเลือกเวลาแบบ Time Picker (ไม่ต้องพิมพ์เอง)
 * 6. ปุ่มส้ม "โพสต์" บันทึกข้อมูลขึ้นระบบและค้นหา Auto-Match ทันที
 * =========================================================================
 */

interface CreatePostScreenProps {
  initialType?: PostType;
  editingPost?: PostItem | null;
  onBack: () => void;
  onSuccess: () => void;
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  initialType = 'lost',
  editingPost = null,
  onBack,
  onSuccess,
}) => {
  const { createPost, updatePost, user } = useApp();
  const { colors, isDark } = useTheme();

  const isEditing = !!editingPost;
  const [type, setType] = useState<PostType>(editingPost?.type || initialType);
  const [title, setTitle] = useState(editingPost?.title || '');
  const [category, setCategory] = useState(editingPost?.category || '');
  const [selectedColor, setSelectedColor] = useState(editingPost?.color || 'ดำ');
  const [location, setLocation] = useState(editingPost?.location || '');
  
  // Date & Time States
  const [date, setDate] = useState(() => {
    if (editingPost?.dateTime) {
      const parts = editingPost.dateTime.split(' ');
      if (parts[0]) return parts[0];
    }
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`;
  });
  const [time, setTime] = useState(() => {
    if (editingPost?.dateTime) {
      const parts = editingPost.dateTime.split(' ');
      if (parts[1]) return parts[1];
    }
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });
  const [description, setDescription] = useState(editingPost?.description || '');
  const [imageUrl, setImageUrl] = useState(editingPost?.imageUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Picker Modals States
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  // เลือกรูปภาพจากคลังภาพ (แปลงเป็น Base64 เพื่อให้แสดงผลได้ทุกเครื่องและทุก Emulator ข้ามเครื่องได้)
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mime = asset.mimeType || 'image/jpeg';
          setImageUrl(`data:${mime};base64,${asset.base64}`);
        } else {
          setImageUrl(asset.uri);
        }
      }
    } catch (e) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเลือกรูปภาพได้');
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
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mime = asset.mimeType || 'image/jpeg';
          setImageUrl(`data:${mime};base64,${asset.base64}`);
        } else {
          setImageUrl(asset.uri);
        }
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
      if (isEditing && editingPost) {
        const wasHidden = editingPost.moderationStatus === 'hidden';
        await updatePost(editingPost.id, {
          type,
          title: title.trim(),
          category,
          color: selectedColor || 'ไม่ระบุ',
          location,
          dateTime: `${date} ${time}`,
          description: description.trim(),
          imageUrl: imageUrl || editingPost.imageUrl,
        });

        onSuccess();
        if (wasHidden) {
          Alert.alert(
            'บันทึกสำเร็จ! 🎉',
            'ข้อมูลโพสต์ที่แก้ไขถูกส่งไปยังผู้ดูแลระบบเพื่อตรวจสอบและปลดระงับเรียบร้อยแล้ว'
          );
        } else {
          Alert.alert('บันทึกสำเร็จ! 🎉', 'ข้อมูลโพสต์ของคุณได้รับการอัปเดตเรียบร้อยแล้ว');
        }
      } else {
        await createPost({
          type,
          title: title.trim(),
          category,
          color: selectedColor || 'ไม่ระบุ',
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

        // รีเซ็ตค่าทันทีป้องกันการเด้งซ้ำ
        setTitle('');
        setDescription('');
        setImageUrl('');

        onSuccess();
        Alert.alert('โพสต์สำเร็จ! 🎉', 'ข้อมูลสิ่งของของคุณถูกบันทึกขึ้นระบบเรียบร้อยแล้ว');
      }
    } catch (e: any) {
      Alert.alert('ข้อผิดพลาด', e.message || 'ไม่สามารถบันทึกโพสต์ได้ กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  const locations = ALL_SUT_LOCATION_NAMES;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? colors.surface : colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.blackCircleBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? 'แก้ไขโพสต์' : 'โพสต์'}</Text>
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

        {/* 5. สี / โทนสี (Color Palette Chips) */}
        <Text style={[styles.label, { color: colors.text }]}>
          สี / โทนสี {selectedColor ? `(เลือก: สี${selectedColor})` : ''}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorChipsScroll}
        >
          {SUT_COLOR_OPTIONS.map((c) => {
            const isSelected = selectedColor === c.name;
            return (
              <TouchableOpacity
                key={c.name}
                style={[
                  styles.colorChip,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? '#334155' : '#FFF7ED')
                      : (isDark ? colors.surface : '#FFFFFF'),
                    borderColor: isSelected ? colors.primary : (isDark ? colors.border : '#E2E8F0'),
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedColor(c.name)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor: c.hex,
                      borderColor: c.border || (c.hex === '#FFFFFF' ? '#CBD5E1' : 'transparent'),
                      borderWidth: c.hex === '#FFFFFF' || c.border ? 1 : 0,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.colorChipText,
                    {
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 6. สถานที่ */}
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
            <Text style={styles.orangeSubmitBtnText}>{isEditing ? 'บันทึกการแก้ไข' : 'โพสต์'}</Text>
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
  colorChipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  colorChipText: {
    fontSize: 13,
  },
});
