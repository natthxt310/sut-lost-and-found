import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostItem } from '../types';
import { StatusBadge } from './StatusBadge';
import { FavoriteButton } from './FavoriteButton';
import { useTheme } from '../context/ThemeContext';
import { getMediaUrl } from '../services/api';

interface ItemCardProps {
  item: PostItem;
  onPress?: () => void;
  showFavoriteButton?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onPress,
  showFavoriteButton = true,
}) => {
  const { colors } = useTheme();
  const isLost = item.type === 'lost';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, shadowColor: colors.shadowColor }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Top Image Box with Floating Badges */}
      <View style={[styles.imageBox, { backgroundColor: colors.surfaceAlt }]}>
        <Image
          source={{ uri: getMediaUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80' }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        {/* Floating Type Pill */}
        <View
          style={[
            styles.typePill,
            { backgroundColor: colors.surface },
            isLost ? styles.typePillLost : styles.typePillFound,
          ]}
        >
          <View
            style={[
              styles.typeDot,
              { backgroundColor: isLost ? '#EF4444' : '#10B981' },
            ]}
          />
          <Text
            style={[
              styles.typePillText,
              { color: isLost ? '#DC2626' : '#059669' },
            ]}
          >
            {isLost ? 'ตามหาของ' : 'แจ้งพบของ'}
          </Text>
        </View>

        {/* Floating Favorite Heart */}
        {showFavoriteButton && (
          <View style={[styles.favPill, { backgroundColor: colors.surface }]}>
            <FavoriteButton postId={item.id} size={16} />
          </View>
        )}

        {/* Floating Category Pill */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText} numberOfLines={1}>
            {item.category}
          </Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <StatusBadge status={item.status} type={item.type} />
        </View>

        {/* Location & Time Info */}
        <View style={styles.metaSection}>
          <View style={styles.metaRow}>
            <Ionicons name="location" size={13} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.location}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.metaTextMuted, { color: colors.textMuted }]}>{item.dateTime}</Text>
          </View>
        </View>

        {/* Bottom Footer Info */}
        <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
          <View style={styles.userSection}>
            <View style={[styles.userAvatar, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
              <Text style={[styles.userAvatarText, { color: colors.primary }]}>
                {item.userName ? item.userName.charAt(0) : 'U'}
              </Text>
            </View>
            <Text style={[styles.userName, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.userName}
            </Text>
          </View>

          <View style={styles.viewDetailBtn}>
            <Text style={[styles.viewDetailText, { color: colors.primary }]}>ดูรายละเอียด</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  imageBox: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  typePill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 5,
  },
  typePillLost: {
    borderColor: '#FEE2E2',
    borderWidth: 1,
  },
  typePillFound: {
    borderColor: '#D1FAE5',
    borderWidth: 1,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  favPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaSection: {
    gap: 5,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  metaTextMuted: {
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  userAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  userAvatarText: {
    fontSize: 10,
    fontWeight: '700',
  },
  userName: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
