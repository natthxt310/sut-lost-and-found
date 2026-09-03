import * as Notifications from 'expo-notifications';
import { Platform, LogBox } from 'react-native';
import { MatchNotification } from '../types';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'Android Push notifications (remote notifications)',
  'expo-notifications',
]);

/**
 * =========================================================================
 * 🔔 Notification Service (Push Notifications & In-App Alerts)
 * =========================================================================
 * จัดการ Push Notification บนระบบปฏิบัติการมือถือ (Android/iOS) และแปลงข้อมูล
 * การแจ้งเตือนทั้ง 6 ชนิดให้เป็นรูปแบบที่เข้าใจง่าย พร้อมไอคอนและสีสัน
 * =========================================================================
 */

// ตั้งค่าให้แสดงแจ้งเตือนแม้เปิดแอปอยู่ (Foreground Notification)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
} catch {
  // Silent fallback for non-supported environments
}

/**
 * ขอสิทธิ์แจ้งเตือนจากระบบปฏิบัติการ
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return false;
    const settings: any = await Notifications.getPermissionsAsync();
    let granted = settings?.granted || settings?.status === 'granted';
    if (!granted) {
      const requested: any = await Notifications.requestPermissionsAsync();
      granted = requested?.granted || requested?.status === 'granted';
    }
    return !!granted;
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return false;
  }
}

/**
 * 📲 ยิง Push Notification ลง System Tray ของเครื่อง (Notification Drawer)
 */
export async function triggerLocalPushNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // ยิงทันที Real-time
    });
    return id;
  } catch (error) {
    console.warn('Failed to schedule local notification:', error);
    return null;
  }
}

export interface FormattedNotification {
  title: string;
  subtitle: string;
  iconName: any;
  iconColor: string;
  badgeText: string;
  badgeBg: string;
  badgeColor: string;
}

/**
 * จัดรูปแบบข้อความ สี และไอคอนตามประเภทของการแจ้งเตือนทั้ง 6 แบบ
 */
export function formatNotification(n: MatchNotification): FormattedNotification {
  const type = n.type || 'match';

  switch (type) {
    case 'approval_approved':
      return {
        title: '✅ โพสต์ของคุณผ่านการอนุมัติแล้ว',
        subtitle: `โพสต์ "${n.sourcePostTitle}" ได้รับการอนุมัติแล้ว และกำลังแสดงบนฟีดสาธารณะ`,
        iconName: 'checkmark-done-circle',
        iconColor: '#10B981',
        badgeText: 'อนุมัติแล้ว',
        badgeBg: '#DCFCE7',
        badgeColor: '#16A34A',
      };

    case 'approval_rejected':
      return {
        title: '❌ โพสต์ของคุณถูกปฏิเสธโดยแอดมิน',
        subtitle: `โพสต์ "${n.sourcePostTitle}" ไม่ผ่านเกณฑ์ (${n.matchedWithContact || 'กรุณาตรวจสอบข้อมูล'})`,
        iconName: 'close-circle',
        iconColor: '#EF4444',
        badgeText: 'ถูกปฏิเสธ',
        badgeBg: '#FEE2E2',
        badgeColor: '#DC2626',
      };

    case 'returned_thankyou':
      return {
        title: '🎁 ส่งคืนสำเร็จแล้ว / ขอบคุณคนดี มทส. ✨',
        subtitle: `โพสต์ "${n.sourcePostTitle}" ส่งคืนเรียบร้อยแล้ว ขอบคุณที่ช่วยสร้างสังคมน่าอยู่`,
        iconName: 'gift',
        iconColor: '#8B5CF6',
        badgeText: 'ส่งคืนสำเร็จ',
        badgeBg: '#EDE9FE',
        badgeColor: '#7C3AED',
      };

    case 'post_expiry_reminder':
      return {
        title: '⏳ เตือนความจำ: โพสต์ของคุณยังตามหาอยู่หรือไม่?',
        subtitle: `โพสต์ "${n.sourcePostTitle}" เผยแพร่มานานแล้ว หากพบของแล้วโปรดอัปเดตสถานะ`,
        iconName: 'time',
        iconColor: '#F59E0B',
        badgeText: 'เตือนความจำ',
        badgeBg: '#FEF3C7',
        badgeColor: '#D97706',
      };

    case 'message':
      return {
        title: `💬 ${n.matchedWithUserName || 'ผู้ใช้ มทส.'} ส่งข้อความถึงคุณ`,
        subtitle: `ข้อความ: "${n.matchedPostTitle || 'สอบถามเกี่ยวกับสิ่งของ'}" (เรื่อง: ${n.sourcePostTitle})`,
        iconName: 'chatbubble-ellipses',
        iconColor: '#0284C7',
        badgeText: 'แชทใหม่',
        badgeBg: '#E0F2FE',
        badgeColor: '#0284C7',
      };

    case 'found':
      return {
        title: '🎉 มีคนพบของที่คุณแจ้งหาย!',
        subtitle: `มีผู้พบ "${n.matchedPostTitle}" ที่ ${n.location} (ตรงกับที่คุณตามหา)`,
        iconName: 'sparkles',
        iconColor: '#EA580C',
        badgeText: 'พบของที่หาย',
        badgeBg: '#FFEDD5',
        badgeColor: '#EA580C',
      };

    case 'match':
    default:
      return {
        title: '✨ พบสิ่งของที่ตรงกับที่คุณแจ้ง!',
        subtitle: `"${n.sourcePostTitle}" ตรงกับโพสต์ของ ${n.matchedWithUserName || 'นักศึกษา มทส.'} (${n.matchScore || 80}%)`,
        iconName: 'checkmark-circle',
        iconColor: '#10B981',
        badgeText: 'จับคู่ตรงกัน',
        badgeBg: '#DCFCE7',
        badgeColor: '#16A34A',
      };
  }
}
