import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MatchNotification } from '../types';
import { useTheme } from '../context/ThemeContext';

interface MatchNotificationCardProps {
  notification: MatchNotification;
  onPress?: () => void;
}

export const MatchNotificationCard: React.FC<MatchNotificationCardProps> = ({
  notification,
  onPress,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBg,
          borderColor: !notification.isRead ? colors.primary : colors.cardBorder,
          shadowColor: colors.shadowColor,
        },
        !notification.isRead && { backgroundColor: isDark ? 'rgba(251, 146, 60, 0.1)' : '#FFFDF9' },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.matchBadge, { backgroundColor: colors.primary }]}>
          <Ionicons name="sparkles" size={13} color="#FFFFFF" />
          <Text style={styles.matchBadgeText}>
            Match สำเร็จ {notification.matchScore}%
          </Text>
        </View>
        <Text style={[styles.dateText, { color: colors.textMuted }]}>
          {new Date(notification.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <Text style={[styles.title, { color: colors.textSecondary }]}>
        พบสิ่งของที่อาจตรงกับ:{' '}
        <Text style={[styles.highlightText, { color: colors.text }]}>"{notification.sourcePostTitle}"</Text>
      </Text>

      <View
        style={[
          styles.detailBox,
          {
            backgroundColor: isDark ? colors.surfaceAlt : '#FFF8E1',
            borderLeftColor: colors.primary,
          },
        ]}
      >
        <Text style={[styles.matchedTitle, { color: colors.text }]} numberOfLines={1}>
          💡 {notification.matchedPostTitle}
        </Text>
        <View style={styles.tagRow}>
          <Text style={[styles.tagText, { color: colors.textSecondary }]}>📍 {notification.location}</Text>
          <Text style={[styles.tagText, { color: colors.textSecondary }]}>🏷️ สี{notification.color}</Text>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
        <Text style={[styles.contactText, { color: colors.primary }]}>
          ติดต่อ: {notification.matchedWithUserName} ({notification.matchedWithContact})
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  matchBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  highlightText: {
    fontWeight: '700',
  },
  detailBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  matchedTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tagText: {
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  contactText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
