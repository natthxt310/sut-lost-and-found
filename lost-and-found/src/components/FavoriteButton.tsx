import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

interface FavoriteButtonProps {
  postId: string;
  size?: number;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ postId, size = 22 }) => {
  const { isFavorite, toggleFavorite } = useApp();
  const { colors, isDark } = useTheme();
  const active = isFavorite(postId);

  const handlePress = async () => {
    await toggleFavorite(postId);
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: isDark ? colors.surface : 'rgba(255, 255, 255, 0.9)' },
        active && { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FFF0F0' },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={size}
        color={active ? '#EF4444' : colors.textSecondary}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
