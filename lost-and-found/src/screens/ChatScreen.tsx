import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { PostItem, ChatMessage } from '../types';
import { api } from '../services/api';
import { moderateChatMessage } from '../services/moderation';

/**
 * =========================================================================
 * 💬 หน้าต่างห้องแชท (Chat Room Screen - ตามแบบ แชท.png)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. ส่วนหัว: ปุ่มย้อนกลับสีดำ, ชื่อผู้ใช้งาน + สถานะ 'ออนไลน์' สีเขียว
 * 2. บับเบิ้ลข้อความ: ฝั่งซ้ายสีเทาอ่อน (คนอื่น) vs ฝั่งขวาสีน้ำเงิน (เรา) พร้อมเวลาด้านล่าง
 * 3. กล่องพิมพ์ข้อความขอบมน พร้อมไอคอนยิ้ม และปุ่มส่งวงกลมสีดำไอคอนเครื่องบินกระดาษ
 * =========================================================================
 */

interface ChatScreenProps {
  post: PostItem;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ post, onBack }) => {
  const { user, markChatAsRead, toggleLikeMessage } = useApp();
  const { colors, isDark } = useTheme();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // โหลดประวัติแชทและมาร์กว่าอ่านแล้ว
  useEffect(() => {
    const loadChat = async () => {
      await markChatAsRead(post.id);
      const history = await api.getMessages(post.id);
      setMessages(history);
    };
    loadChat();

    const interval = setInterval(loadChat, 3000);
    return () => clearInterval(interval);
  }, [post.id]);

  const handleSend = async () => {
    const textToSend = inputText.trim();
    if (!textToSend) return;

    // 🛡️ ตรวจสอบคำไม่เหมาะสม / คำหยาบในข้อความแชท
    const modCheck = moderateChatMessage(textToSend);
    if (!modCheck.isSafe) {
      Alert.alert(
        'ข้อความไม่เหมาะสม ⚠️',
        modCheck.reason || 'ตรวจพบคำไม่สุภาพในข้อความแชท กรุณาใช้ถ้อยคำที่สุภาพ'
      );
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }

    setIsSending(true);
    setInputText('');

    // ระบุผู้รับข้อความ:
    // ถ้าเราเป็นเจ้าของโพสต์ ให้ส่งหาคนที่ทักเรามา (คนอื่นในห้องแชท)
    // ถ้าเราไม่ใช่เจ้าของโพสต์ ให้ส่งหาเจ้าของโพสต์
    const otherMsg = messages.find((m) => m.senderId !== user?.id);
    const targetReceiverId = (user?.id === post.userId && otherMsg) ? otherMsg.senderId : (post.userId || 'usr-receiver');
    const targetReceiverName = (user?.id === post.userId && otherMsg) ? otherMsg.senderName : (post.userName || 'ผู้ใช้ มทส.');

    const newMsg = await api.sendMessage(
      post.id,
      post.title,
      targetReceiverId,
      targetReceiverName,
      textToSend
    );

    setMessages((prev) => [...prev, newMsg]);
    setIsSending(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleLike = async (msgId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updated = await api.toggleLikeMessage(post.id, msgId);
      setMessages(updated);
    } catch {
      // Ignore
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          style={styles.blackCircleBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* User Info & Online Dot on Right */}
        <View style={styles.headerRightInfo}>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.headerUserName, { color: colors.text }]}>
              {post.userName || 'ชื่อผู้ใช้งาน'}
            </Text>
            <Text style={styles.onlineStatusText}>ออนไลน์</Text>
          </View>

          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={22} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesScroll}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg) => {
          const isMine = msg.senderId === user?.id || msg.senderName === user?.fullName;
          const timeStr = msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '10:25';

          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isMine ? styles.myMessageRow : styles.otherMessageRow,
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.messageBubble,
                  isMine
                    ? [styles.myBubble, { backgroundColor: '#0055D4' }]
                    : [styles.otherBubble, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }],
                ]}
                onLongPress={() => handleLike(msg.id)}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.messageText,
                    isMine ? styles.myMessageText : { color: colors.text },
                  ]}
                >
                  {msg.text}
                </Text>
                {msg.liked && (
                  <View style={styles.heartBadge}>
                    <Text style={{ fontSize: 12 }}>❤️</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={[styles.timestampText, { color: colors.textMuted }]}>
                {timeStr}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Message Input Bar */}
      <View style={[styles.inputBarContainer, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
        <View
          style={[
            styles.pillInputBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="พิมพ์ข้อความ..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity activeOpacity={0.7} style={{ padding: 4 }}>
            <Ionicons name="happy-outline" size={22} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Black Circular Send Button with Blue Paper Plane */}
        <TouchableOpacity
          style={[styles.blackSendBtn, isSending && { opacity: 0.7 }]}
          onPress={handleSend}
          disabled={isSending}
          activeOpacity={0.85}
        >
          <Ionicons name="paper-plane" size={18} color="#38BDF8" style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  blackCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerUserName: {
    fontSize: 15,
    fontWeight: '800',
  },
  onlineStatusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesScroll: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 16,
  },
  messageRow: {
    maxWidth: '75%',
  },
  myMessageRow: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageRow: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    position: 'relative',
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  timestampText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  heartBadge: {
    position: 'absolute',
    bottom: -8,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    elevation: 2,
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    gap: 10,
    borderTopWidth: 1,
  },
  pillInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  blackSendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
});
