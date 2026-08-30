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
import { MatchNotification } from '../types';

/**
 * =========================================================================
 * 🔔 หน้าการแจ้งเตือน (Notifications Screen - ตามแบบ แจ้งเตือน.png)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. การ์ดสีขาวขอบมน พร้อมไอคอนวงกลม 3 สี:
 *    - 🔴 วงกลมสีแดง (กระดิ่ง): มีคนพบของที่คุณแจ้งหาย
 *    - 🔵 วงกลมสีน้ำเงิน (แชท): มีข้อความใหม่
 *    - 🟢 วงกลมสีเขียว (จับคู่): ระบบจับคู่สิ่งของที่อาจตรงกัน
 * =========================================================================
 */

interface NotificationScreenProps {
  onSelectNotification?: (notification: MatchNotification) => void;
  onOpenChatList?: () => void;
}

export const NotificationScreen: React.FC<NotificationScreenProps> = ({
  onSelectNotification,
  onOpenChatList,
}) => {
  const {
    notifications,
    unreadNotifsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    refreshData,
    isLoading,
  } = useApp();
  const { colors, isDark } = useTheme();

  const handlePress = async (n: MatchNotification) => {
    await markNotificationAsRead(n.id);
    if (onSelectNotification) {
      onSelectNotification(n);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>การแจ้งเตือน</Text>
        {notifications.length > 0 ? (
          <TouchableOpacity
            onPress={clearAllNotifications}
            style={styles.clearBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} colors={[colors.primary]} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={54} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              ไม่มีการแจ้งเตือนในขณะนี้
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              เมื่อมีผู้โพสต์สิ่งของที่ตรงกับที่คุณแจ้งไว้ หรือมีข้อความแชทใหม่ ระบบจะแจ้งเตือนที่นี่
            </Text>
          </View>
        ) : (
          notifications.map((n, idx) => {
            // สลับสีไอคอน 3 แบบตาม Mockup: แดง (ของหาย) / น้ำเงิน (ข้อความ) / เขียว (จับคู่)
            const iconType = idx % 3 === 0 ? 'red' : idx % 3 === 1 ? 'blue' : 'green';

            return (
              <TouchableOpacity
                key={n.id}
                style={[
                  styles.notifCard,
                  { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadowColor },
                ]}
                onPress={() => handlePress(n)}
                activeOpacity={0.88}
              >
                {/* Colored Circle Icon */}
                <View
                  style={[
                    styles.iconCircle,
                    iconType === 'red'
                      ? { backgroundColor: '#EF4444' }
                      : iconType === 'blue'
                      ? { backgroundColor: '#0055D4' }
                      : { backgroundColor: '#10B981' },
                  ]}
                >
                  <Ionicons
                    name={
                      iconType === 'red'
                        ? 'notifications'
                        : iconType === 'blue'
                        ? 'chatbubble'
                        : 'copy'
                    }
                    size={26}
                    color="#FFFFFF"
                  />
                </View>

                {/* Content */}
                <View style={styles.notifDetails}>
                  <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>
                    {iconType === 'red'
                      ? 'มีคนพบของที่คุณแจ้งหาย'
                      : iconType === 'blue'
                      ? `${n.matchedWithUserName || 'ผู้ใช้ มทส.'} ส่งข้อความถึงคุณ`
                      : 'ระบบจับคู่สิ่งของที่อาจตรงกัน'}
                  </Text>

                  <Text style={[styles.notifSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                    {n.sourcePostTitle || n.matchedPostTitle || 'สิ่งของที่อาจตรงกัน'}
                  </Text>

                  <Text style={[styles.notifTime, { color: colors.textMuted }]}>
                    {n.createdAt
                      ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '5 นาทีที่แล้ว'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
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
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  clearBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 14,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    gap: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDetails: {
    flex: 1,
    gap: 3,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  notifSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  notifTime: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
