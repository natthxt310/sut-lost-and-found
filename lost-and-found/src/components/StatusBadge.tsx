import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ItemStatus } from '../types';
import { useTheme } from '../context/ThemeContext';

interface StatusBadgeProps {
  status: ItemStatus;
  type?: 'lost' | 'found';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  const { colors, isDark } = useTheme();

  const getBadgeConfig = () => {
    switch (status) {
      case 'lost':
        return {
          label: type === 'found' ? 'รอเจ้าของติดต่อ' : 'ยังไม่เจอ (Lost)',
          bg: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FFEBEE',
          text: isDark ? '#F87171' : '#D32F2F',
          border: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FFCDD2',
        };
      case 'found':
        return {
          label: 'เจอแล้ว / รอส่งมอบ',
          bg: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FFF3E0',
          text: isDark ? '#FBBF24' : '#E65100',
          border: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FFE0B2',
        };
      case 'returned':
        return {
          label: 'ส่งคืนเรียบร้อย ✓',
          bg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#E8F5E9',
          text: isDark ? '#34D399' : '#2E7D32',
          border: isDark ? 'rgba(16, 185, 129, 0.35)' : '#C8E6C9',
        };
      default:
        return {
          label: 'ทั่วไป',
          bg: isDark ? colors.surfaceAlt : '#F5F5F5',
          text: isDark ? colors.textSecondary : '#616161',
          border: isDark ? colors.border : '#E0E0E0',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
