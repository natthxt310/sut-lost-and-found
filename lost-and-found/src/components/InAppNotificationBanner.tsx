import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MatchNotification } from '../types';
import { formatNotification } from '../services/notificationService';

const { width } = Dimensions.get('window');

interface InAppNotificationBannerProps {
  notification: MatchNotification | null;
  onPress: (notif: MatchNotification) => void;
  onDismiss: () => void;
}

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  notification,
  onPress,
  onDismiss,
}) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (notification) {
      // สั่นเบาๆ ให้ผู้ใช้รับรู้
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // silent fallback
      }

      // เล่นแอนิเมชันเลื่อนลงมา
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // ซ่อนอัตโนมัติเมื่อครบ 4.5 วินาที
      const timer = setTimeout(() => {
        dismissBanner();
      }, 4500);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-120);
      opacity.setValue(0);
    }
  }, [notification]);

  const dismissBanner = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!notification) return null;

  const formatted = formatNotification(notification);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.banner}
        activeOpacity={0.92}
        onPress={() => {
          dismissBanner();
          onPress(notification);
        }}
      >
        {/* Icon Circle */}
        <View style={[styles.iconBox, { backgroundColor: formatted.iconColor }]}>
          <Ionicons name={formatted.iconName} size={22} color="#FFFFFF" />
        </View>

        {/* Text Details */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {formatted.title}
            </Text>
            <View style={[styles.badge, { backgroundColor: formatted.badgeBg }]}>
              <Text style={[styles.badgeText, { color: formatted.badgeColor }]}>
                {formatted.badgeText}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            {formatted.subtitle}
          </Text>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={dismissBanner}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 34,
    left: 16,
    right: 16,
    zIndex: 999999,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  banner: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
