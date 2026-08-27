import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { PostItem, ChatMessage } from '../types';

/**
 * =========================================================================
 * 💬 ห้องแชทสไตล์ Instagram Direct (IG Direct Chat Screen)
 * =========================================================================
 * 💡 อธิบายการทำงานแบบเข้าใจง่าย:
 * ออกแบบห้องแชทสไตล์ Instagram Direct (DM):
 * 1. บับเบิ้ลข้อความทรงกลมนุ่มนวล (Pill Bubbles)
 * 2. กดหัวใจ ❤️ (Like Message) ให้ข้อความที่ชอบได้
 * 3. มีสถานะ "อ่านแล้ว (Seen)" ใต้ข้อความล่าสุด
 * 4. เมื่อเปิดเข้ามาในห้องนี้ จะมาร์กข้อความเป็น "อ่านแล้ว" ทันที ทำให้ตัวเลขแจ้งเตือนที่แท็บบาร์หายไป
 * =========================================================================
 */

interface ChatScreenProps {
  post: PostItem;
  onBack: () => void;
}

const QUICK_REPLIES = [
  '👋 สวัสดีครับ ทักเรื่องของชิ้นนี้ครับ',
  '📍 นัดรับที่อาคารเรียนรวม 1 (B1) สะดวกมั้ยครับ',
  '🏢 นัดรับที่ศูนย์บรรณสาร (หอสมุด) สะดวกมั้ยครับ',
  '🍽️ นัดรับที่โรงอาหารสุรนิเวศน์ (กาสะลอง) ได้มั้ยครับ',
  '📞 ขอช่องทางติดต่อ Line / เบอร์โทร เพิ่มเติมหน่อยครับ',
  '✅ ได้รับของส่งคืนเรียบร้อยแล้ว ขอบคุณมากครับ!',
];

export const ChatScreen: React.FC<ChatScreenProps> = ({ post, onBack }) => {
  const { user, refreshConversations, markChatAsRead, toggleLikeMessage } = useApp();
  const { colors, isDark } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const isMyPost = user?.id === post.userId;
  const receiverId = isMyPost ? 'usr-requester' : post.userId;
  const receiverName = isMyPost ? 'ผู้ติดต่อขอรับของ' : post.userName;

  const loadChatHistory = async (showLoading: boolean = false) => {
    try {
      if (showLoading) setLoading(true);
      const history = await api.getMessages(post.id);

      if (history.length === 0) {
        const welcomeMsg: ChatMessage = {
          id: `welcome-${post.id}`,
          postId: post.id,
          postTitle: post.title,
          senderId: post.userId,
          senderName: post.userName,
          receiverId: user?.id || 'usr-current',
          receiverName: user?.fullName || 'ฉัน',
          text: `สวัสดีครับ! ติดต่อสอบถามเกี่ยวกับ "${post.title}" ที่ ${post.location} สามารถพิมพ์ข้อความหรือเลือกคำตอบด่วนด้านล่างได้เลยครับ`,
          isRead: true,
          createdAt: post.createdAt,
        };
        setMessages([welcomeMsg]);
      } else {
        setMessages(history);
      }

      // ✅ เคลียร์สถานะการอ่านทันที เพื่อให้ Badge แท็บบาร์ด้านล่างหายไปทันที
      await markChatAsRead(post.id);
    } catch (err) {
      console.error('Error loading chat:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadChatHistory(true);

    // 🔄 Auto-polling: ดึงข้อความใหม่อัตโนมัติทุก 2.5 วินาทีขณะเปิดหน้านี้อยู่
    const timer = setInterval(() => {
      loadChatHistory(false);
    }, 2500);

    return () => clearInterval(timer);
  }, [post.id]);

  const handleSend = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content) return;

    try {
      setSending(true);
      setInputText('');

      const newMsg = await api.sendMessage(
        post.id,
        post.title,
        receiverId,
        receiverName,
        content
      );

      // อัปเดตข้อความบนหน้าจอทันที
      setMessages((prev) => [...prev.filter((m) => m.id !== newMsg.id), newMsg]);
      refreshConversations();
      await markChatAsRead(post.id);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleLikeMessage = async (msgId: string) => {
    // สลับสถานะหัวใจ ❤️ (Like reaction)
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, liked: !m.liked } : m))
    );
    await toggleLikeMessage(post.id, msgId);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.modalBg }]}>
      {/* IG-Style Top Navigation Bar */}
      <View style={[styles.topHeader, { backgroundColor: colors.modalBg, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerProfileWrap}>
          <View style={styles.headerAvatarContainer}>
            {post.imageUrl ? (
              <Image source={{ uri: post.imageUrl }} style={styles.headerAvatarImg} />
            ) : (
              <View style={[styles.headerAvatarPlaceholder, { backgroundColor: colors.primaryBg }]}>
                <Ionicons name="person" size={16} color={colors.primary} />
              </View>
            )}
            <View style={styles.headerOnlineDot} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerUsername, { color: colors.text }]} numberOfLines={1}>
              {receiverName}
            </Text>
            <Text style={[styles.headerActivity, { color: colors.textSecondary }]}>
              {post.type === 'found' ? 'ผู้เก็บสิ่งของได้' : 'ผู้ตามหาสิ่งของ'} • ออนไลน์
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => loadChatHistory(true)} style={styles.headerActionBtn}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Item Summary Banner Card */}
      <View style={[styles.itemBanner, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <Image source={{ uri: post.imageUrl }} style={styles.itemThumb} />
        <View style={styles.itemBannerInfo}>
          <Text style={[styles.itemBannerType, { color: post.type === 'lost' ? colors.danger : colors.success }]}>
            {post.type === 'lost' ? '🔴 ประกาศของหาย' : '🟢 แจ้งพบของ'}
          </Text>
          <Text style={[styles.itemBannerTitle, { color: colors.text }]} numberOfLines={1}>
            {post.title}
          </Text>
          <Text style={[styles.itemBannerLocation, { color: colors.textSecondary }]}>📍 {post.location}</Text>
        </View>
      </View>

      {/* Messages Scroll Area */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.messagesScroll, { backgroundColor: colors.background }]}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>กำลังโหลดข้อความ...</Text>
            </View>
          ) : (
            messages.map((msg, index) => {
              const isMine = msg.senderId === user?.id || (msg.senderId !== post.userId && !isMyPost);
              const isLastMessage = index === messages.length - 1;

              return (
                <View key={msg.id} style={styles.messageWrapper}>
                  <View
                    style={[styles.messageRow, isMine ? styles.myMessageRow : styles.theirMessageRow]}
                  >
                    {!isMine && (
                      <View style={[styles.avatarSmall, { backgroundColor: colors.primaryBg }]}>
                        <Ionicons name="person" size={13} color={colors.primary} />
                      </View>
                    )}

                    {/* Double-tap to Like message */}
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onLongPress={() => handleLikeMessage(msg.id)}
                      style={[
                        styles.bubble,
                        isMine
                          ? [styles.myBubble, { backgroundColor: colors.chatBubbleMine }]
                          : [styles.theirBubble, { backgroundColor: colors.chatBubbleOther, borderColor: colors.borderLight }],
                      ]}
                    >
                      {!isMine && (
                        <Text style={[styles.senderNameLabel, { color: colors.primary }]}>{msg.senderName}</Text>
                      )}
                      <Text
                        style={[
                          styles.bubbleText,
                          { color: isMine ? colors.chatBubbleTextMine : colors.chatBubbleTextOther },
                        ]}
                      >
                        {msg.text}
                      </Text>

                      {/* Heart Like Badge (IG Style) */}
                      {msg.liked && (
                        <View style={styles.likedHeartBadge}>
                          <Text style={{ fontSize: 11 }}>❤️</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Time & "อ่านแล้ว (Seen)" Receipt under message */}
                  <View style={[styles.statusRow, isMine ? { justifyContent: 'flex-end', paddingRight: 4 } : { paddingLeft: 34 }]}>
                    <Text style={[styles.messageTimeText, { color: colors.textMuted }]}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {isMine && isLastMessage && (
                      <Text style={[styles.seenText, { color: colors.textMuted }]}> • อ่านแล้ว</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Quick Replies Suggestion Chips */}
        <View style={[styles.quickRepliesSection, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
          <Text style={[styles.quickRepliesLabel, { color: colors.textSecondary }]}>💡 ข้อความด่วน (แตะเพื่อส่งทันที):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
            {QUICK_REPLIES.map((text, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.quickChip, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}
                onPress={() => handleSend(text)}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickChipText, { color: colors.primary }]}>{text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* IG-Style Bottom Input Bar */}
        <View style={[styles.inputSection, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
          <TouchableOpacity style={styles.inputLeftIcon} activeOpacity={0.7}>
            <Ionicons name="camera" size={22} color={colors.primary} />
          </TouchableOpacity>

          <TextInput
            style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.borderLight }]}
            placeholder="ส่งข้อความ..."
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor={colors.placeholder}
            multiline
          />

          {inputText.trim() ? (
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.primary }]}
              onPress={() => handleSend()}
              disabled={sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.sendBtnText}>ส่ง</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.heartQuickBtn}
              onPress={() => handleSend('❤️')}
              activeOpacity={0.7}
            >
              <Ionicons name="heart" size={26} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerProfileWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerAvatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  headerAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerUsername: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerActivity: {
    fontSize: 11,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    padding: 6,
  },
  itemBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 12,
  },
  itemThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  itemBannerInfo: {
    flex: 1,
  },
  itemBannerType: {
    fontSize: 10,
    fontWeight: '700',
  },
  itemBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemBannerLocation: {
    fontSize: 11,
  },
  messagesScroll: {
    padding: 14,
    paddingBottom: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  messageWrapper: {
    marginBottom: 10,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '76%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    position: 'relative',
  },
  myBubble: {
    borderBottomRightRadius: 5,
  },
  theirBubble: {
    borderBottomLeftRadius: 5,
    borderWidth: 1,
  },
  senderNameLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 19,
  },
  likedHeartBadge: {
    position: 'absolute',
    bottom: -8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  messageTimeText: {
    fontSize: 10,
  },
  seenText: {
    fontSize: 10,
    fontWeight: '600',
  },
  quickRepliesSection: {
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: 1,
  },
  quickRepliesLabel: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  quickScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  inputLeftIcon: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 90,
  },
  sendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  heartQuickBtn: {
    padding: 4,
  },
});
