import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface CameraCaptureProps {
  imageUri: string;
  onImageChange: (uri: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  imageUri,
  onImageChange,
}) => {
  const { colors, isDark } = useTheme();
  const [isCapturing, setIsCapturing] = useState(false);

  const takePhotoWithCamera = async () => {
    try {
      setIsCapturing(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'ต้องการสิทธิ์การเข้าถึงกล้อง',
          'กรุณาอนุญาตการเข้าถึงกล้องถ่ายรูปเพื่อถ่ายภาพสิ่งของประกอบโพสต์'
        );
        setIsCapturing(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const serverUrl = await api.uploadImage(asset.base64, asset.uri);
          onImageChange(serverUrl);
        } else {
          onImageChange(asset.uri);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเปิดกล้องได้');
    } finally {
      setIsCapturing(false);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      setIsCapturing(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตการเข้าถึงคลังภาพ');
        setIsCapturing(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const serverUrl = await api.uploadImage(asset.base64, asset.uri);
          onImageChange(serverUrl);
        } else {
          onImageChange(asset.uri);
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        รูปภาพสิ่งของ / สถานที่จริง
      </Text>

      {imageUri ? (
        <View style={[styles.previewContainer, { borderColor: colors.border }]}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <View style={[styles.previewActions, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.retakeButton, { backgroundColor: colors.primary }]}
              onPress={takePhotoWithCamera}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
              <Text style={styles.retakeButtonText}>ถ่ายใหม่</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.removeButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FFEBEE' }]}
              onPress={() => onImageChange('')}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={[styles.removeButtonText, { color: colors.danger }]}>ลบรูป</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.cameraButton,
              {
                backgroundColor: colors.primaryBg,
                borderColor: colors.primary,
              },
            ]}
            onPress={takePhotoWithCamera}
            activeOpacity={0.8}
            disabled={isCapturing}
          >
            <Ionicons name="camera" size={24} color={colors.primary} />
            <Text style={[styles.cameraButtonText, { color: colors.primary }]}>เปิดกล้องถ่ายภาพจริง</Text>
            <Text style={[styles.cameraSubtext, { color: colors.primaryLight }]}>ใช้ Camera Sensor มือถือ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.galleryButton,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
              },
            ]}
            onPress={pickImageFromGallery}
            activeOpacity={0.8}
          >
            <Ionicons name="images-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.galleryButtonText, { color: colors.textSecondary }]}>เลือกจากคลังรูปภาพ</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  buttonsContainer: {
    gap: 8,
  },
  cameraButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButtonText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  cameraSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  galleryButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  previewContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#000000',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
