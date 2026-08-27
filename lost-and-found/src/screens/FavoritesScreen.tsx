import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ItemCard } from '../components/ItemCard';
import { FavoriteItem, PostItem } from '../types';

// =========================================================================
// ❤️ หน้ารายการโปรดและโน้ตส่วนตัว (Favorites Screen)
// =========================================================================
// 💡 อธิบายการทำงานแบบเข้าใจง่าย:
// สำหรับดูรายการสิ่งของที่เราเคยกด "หัวใจ" บันทึกเก็บไว้ติดตาม
// 
// 📌 ฟีเจอร์พิเศษ:
// - บันทึกโน้ตช่วยจำส่วนตัว (Personal Note): เช่น "นัดรับของวันจันทร์ตอนเที่ยง" 
//   โดยคนอื่นจะไม่เห็นโน้ตนี้ มีเพียงเราคนเดียวที่อ่านและแก้ไขได้!
// =========================================================================

interface FavoritesScreenProps {
  onSelectPost: (post: PostItem) => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ onSelectPost }) => {
  const { favorites, toggleFavorite, updateFavoriteNote, refreshData, isLoading } = useApp();
  const { colors, isDark } = useTheme();
  const [selectedFav, setSelectedFav] = useState<FavoriteItem | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteModalVisible, setNoteModalVisible] = useState(false);

  const handleOpenNoteModal = (fav: FavoriteItem) => {
    setSelectedFav(fav);
    setNoteText(fav.personalNote || '');
    setNoteModalVisible(true);
  };

  const handleSaveNote = async () => {
    if (!selectedFav) return;
    try {
      await updateFavoriteNote(selectedFav.id, noteText);
      setNoteModalVisible(false);
      Alert.alert('สำเร็จ', 'บันทึกโน้ตส่วนตัวเรียบร้อยแล้ว');
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกโน้ตได้');
    }
  };

  const handleRemove = async (postId: string) => {
    Alert.alert('ลบออกจากรายการโปรด', 'ต้องการนำรายการนี้ออกจากรายการโปรดหรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบออก',
        style: 'destructive',
        onPress: async () => {
          await toggleFavorite(postId);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.modalBg }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>รายการโปรดที่บันทึกไว้</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          ติดตามโพสต์ที่สนใจ พร้อมบันทึกโน้ตส่วนตัว ({favorites.length} รายการ)
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} colors={[colors.primary]} />
        }
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={54} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>ยังไม่มีรายการโปรด</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              กดไอคอนรูปหัวใจที่โพสต์ของหายหรือพบของ เพื่อบันทึกไว้ติดตามที่นี่
            </Text>
          </View>
        ) : (
          favorites.map((fav) => (
            <View key={fav.id} style={styles.favCardWrapper}>
              <ItemCard
                item={fav.post}
                onPress={() => onSelectPost(fav.post)}
                showFavoriteButton={false}
              />

              {/* กล่องโน้ตส่วนตัว */}
              <View style={[styles.noteSection, { backgroundColor: isDark ? colors.surfaceAlt : '#FFF8E1', borderColor: colors.border }]}>
                <View style={styles.noteHeader}>
                  <View style={styles.noteTitleRow}>
                    <Ionicons name="create-outline" size={14} color={colors.primary} />
                    <Text style={[styles.noteLabel, { color: colors.primary }]}>โน้ตส่วนตัวของคุณ:</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleOpenNoteModal(fav)}
                    style={[styles.editNoteBtn, { backgroundColor: colors.cardBg, borderColor: colors.primary }]}
                  >
                    <Text style={[styles.editNoteBtnText, { color: colors.primary }]}>
                      {fav.personalNote ? 'แก้ไขโน้ต' : '+ เพิ่มโน้ต'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {fav.personalNote ? (
                  <Text style={[styles.noteContent, { color: colors.text }]}>"{fav.personalNote}"</Text>
                ) : (
                  <Text style={[styles.noNoteText, { color: colors.textMuted }]}>ยังไม่มีโน้ตส่วนตัว (แตะเพื่อเพิ่มบันทึกช่วยจำ)</Text>
                )}

                <TouchableOpacity
                  style={[styles.removeFavBtn, { borderTopColor: colors.borderLight }]}
                  onPress={() => handleRemove(fav.postId)}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.danger} />
                  <Text style={[styles.removeFavText, { color: colors.danger }]}>ลบออกจากรายการโปรด</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal แก้ไขโน้ตส่วนตัว */}
      <Modal
        visible={noteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.modalBg }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>📝 บันทึกโน้ตส่วนตัว (Personal Note)</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              บันทึกช่วยจำ เช่น นัดรับของเมื่อไหร่ หรือเบอร์โทรเพิ่มเติม
            </Text>

            <TextInput
              style={[styles.noteInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
              placeholder="พิมพ์ข้อความโน้ตของคุณที่นี่..."
              placeholderTextColor={colors.placeholder}
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveNote}>
                <Text style={styles.saveBtnText}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  favCardWrapper: {
    marginBottom: 16,
  },
  noteSection: {
    borderRadius: 14,
    padding: 12,
    marginTop: -4,
    borderWidth: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  editNoteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  editNoteBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noteContent: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  noNoteText: {
    fontSize: 11,
    marginBottom: 8,
  },
  removeFavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  removeFavText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
