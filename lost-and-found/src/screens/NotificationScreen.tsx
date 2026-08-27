import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { MatchNotificationCard } from '../components/MatchNotificationCard';
import { MatchNotification } from '../types';

// =========================================================================
// 🔔 หน้าการแจ้งเตือนการจับคู่ (Match Notification Feed)
// =========================================================================
// 💡 อธิบายการทำงานแบบเข้าใจง่าย:
// ทำหน้าที่เหมือน "ศูนย์แจ้งเตือนอัจฉริยะ"
// เมื่อระบบตรวจพบว่ามี "โพสต์ใหม่" ที่มีหมวดหมู่, สี, หรือสถานที่ตรงกับของที่เราเคยโพสต์ไว้ (>= 70%)
// ระบบจะสร้างการ์ดแจ้งเตือนขึ้นมาในหน้านี้ทันที พร้อมบอก % ความเหมือน และข้อมูลติดต่อด่วน!
// =========================================================================

interface NotificationScreenProps {
  onSelectNotification?: (notification: MatchNotification) => void;
}

export const NotificationScreen: React.FC<NotificationScreenProps> = ({
  onSelectNotification,
}) => {
  const {
    notifications,             // รายการแจ้งเตือนทั้งหมด
    unreadNotifsCount,         // จำนวนที่ยังไม่ได้อ่าน
    markNotificationAsRead,    // มาร์กว่าอ่านแล้ว
    markAllNotificationsAsRead,// มาร์กว่าอ่านทั้งหมดแล้ว
    clearAllNotifications,     // ล้างแจ้งเตือนทั้งหมด
    refreshData,
    isLoading,
  } = useApp();
  const { colors } = useTheme();

  const handlePress = async (n: MatchNotification) => {
    await markNotificationAsRead(n.id);
    if (onSelectNotification) {
      onSelectNotification(n);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>
            การแจ้งเตือนการจับคู่ (In-App Match Feed)
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            แจ้งเตือนทันทีเมื่อระบบตรวจพบข้อมูลของหายและพบของตรงกัน
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={clearAllNotifications}
              style={[styles.markAllBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <Text style={[styles.markAllText, { color: colors.textSecondary }]}>ล้างทั้งหมด</Text>
            </TouchableOpacity>
          )}
          {unreadNotifsCount > 0 && (
            <TouchableOpacity
              onPress={markAllNotificationsAsRead}
              style={[styles.markAllBtn, { backgroundColor: colors.primaryBg }]}
            >
              <Text style={[styles.markAllText, { color: colors.primary }]}>อ่านทั้งหมด</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} colors={[colors.primary]} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={54} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>ยังไม่มีการแจ้งเตือนใหม่</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              เมื่อมีผู้โพสต์ของหายหรือพบของที่มีแท็กตรงกับสิ่งของที่คุณโพสต์ ระบบจะแจ้งเตือนอัตโนมัติที่นี่
            </Text>
          </View>
        ) : (
          notifications.map((n) => (
            <MatchNotificationCard
              key={n.id}
              notification={n}
              onPress={() => handlePress(n)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  markAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
});
