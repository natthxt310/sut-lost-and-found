import React, { useState } from 'react';
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
import { formatNotification } from '../services/notificationService';

/**
 * =========================================================================
 * 🔔 หน้าศูนย์รวมการแจ้งเตือน (Notification Center)
 * =========================================================================
 * 💡 รองรับการแจ้งเตือน 6 ประเภทหลัก:
 * 1. 🟢 อนุมัติโพสต์ (approval_approved)
 * 2. 🔴 ปฏิเสธโพสต์ (approval_rejected)
 * 3. 🟣 ส่งคืนสำเร็จ / คำขอบคุณ (returned_thankyou)
 * 4. 🟡 เตือนต่ออายุโพสต์เก่า (post_expiry_reminder)
 * 5. 🔵 ข้อความแชทใหม่ (message)
 * 6. ✨ จับคู่ของหายตรงกัน (match / found)
 * =========================================================================
 */

interface NotificationScreenProps {
  onSelectNotification?: (notification: MatchNotification) => void;
  onOpenChatList?: () => void;
}

export const NotificationScreen: React.FC<NotificationScreenProps> = ({
  onSelectNotification,
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

  // ตัวกรองหมวดหมู่
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'moderation' | 'chat'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'unread') return !n.isRead;
    if (filterType === 'moderation') {
      return n.type === 'approval_approved' || n.type === 'approval_rejected';
    }
    if (filterType === 'chat') {
      return n.type === 'message';
    }
    return true;
  });

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
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>การแจ้งเตือน</Text>
          {unreadNotifsCount > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{unreadNotifsCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadNotifsCount > 0 && (
            <TouchableOpacity
              onPress={markAllNotificationsAsRead}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="checkmark-done-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={clearAllNotifications}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs / Pills */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === 'all'
                ? { backgroundColor: colors.primary }
                : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterPillText, filterType === 'all' ? styles.filterPillTextActive : { color: colors.textSecondary }]}>
              ทั้งหมด ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === 'unread'
                ? { backgroundColor: colors.primary }
                : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
            ]}
            onPress={() => setFilterType('unread')}
          >
            <Text style={[styles.filterPillText, filterType === 'unread' ? styles.filterPillTextActive : { color: colors.textSecondary }]}>
              ยังไม่อ่าน ({unreadNotifsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === 'moderation'
                ? { backgroundColor: colors.primary }
                : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
            ]}
            onPress={() => setFilterType('moderation')}
          >
            <Text style={[styles.filterPillText, filterType === 'moderation' ? styles.filterPillTextActive : { color: colors.textSecondary }]}>
              🛡️ ผลอนุมัติ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === 'chat'
                ? { backgroundColor: colors.primary }
                : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
            ]}
            onPress={() => setFilterType('chat')}
          >
            <Text style={[styles.filterPillText, filterType === 'chat' ? styles.filterPillTextActive : { color: colors.textSecondary }]}>
              💬 ข้อความแชท
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} colors={[colors.primary]} />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={54} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {filterType === 'unread'
                ? 'อ่านการแจ้งเตือนครบหมดแล้ว'
                : filterType === 'moderation'
                ? 'ยังไม่มีการแจ้งเตือนผลการตรวจสอบ'
                : filterType === 'chat'
                ? 'ยังไม่มีข้อความแชทใหม่'
                : 'ไม่มีการแจ้งเตือนในขณะนี้'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              เมื่อมีโพสต์ที่ตรงกัน, ผลอนุมัติจากแอดมิน หรือมีผู้ติดต่อขอนัดรับของ ระบบจะแจ้งเตือนที่นี่ทันที
            </Text>
          </View>
        ) : (
          filteredNotifications.map((n) => {
            const formatted = formatNotification(n);

            return (
              <TouchableOpacity
                key={n.id}
                style={[
                  styles.notifCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: !n.isRead ? colors.primary : colors.border,
                    shadowColor: colors.shadowColor,
                    borderLeftWidth: !n.isRead ? 4 : 1,
                    borderLeftColor: !n.isRead ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handlePress(n)}
                activeOpacity={0.88}
              >
                {/* Colored Circle Icon */}
                <View style={[styles.iconCircle, { backgroundColor: formatted.iconColor }]}>
                  <Ionicons name={formatted.iconName} size={24} color="#FFFFFF" />
                </View>

                {/* Content */}
                <View style={styles.notifDetails}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>
                      {formatted.title}
                    </Text>
                    <View style={[styles.typeBadge, { backgroundColor: formatted.badgeBg }]}>
                      <Text style={[styles.typeBadgeText, { color: formatted.badgeColor }]}>
                        {formatted.badgeText}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.notifSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                    {formatted.subtitle}
                  </Text>

                  <View style={styles.footerRow}>
                    <Text style={[styles.notifTime, { color: colors.textMuted }]}>
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'เมื่อสักครู่'}
                    </Text>
                    {!n.isRead && (
                      <View style={styles.unreadDotBox}>
                        <View style={styles.unreadDot} />
                        <Text style={styles.unreadDotText}>ใหม่</Text>
                      </View>
                    )}
                  </View>
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
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  unreadCountBadge: {
    backgroundColor: '#FF7A00',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 6,
  },
  filterRow: {
    paddingBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    gap: 12,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  notifDetails: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  notifSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  notifTime: {
    fontSize: 11,
  },
  unreadDotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF7A00',
  },
  unreadDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF7A00',
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
