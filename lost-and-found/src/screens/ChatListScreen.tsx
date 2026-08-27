import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { PostItem, ChatConversation } from '../types';

/**
 * =========================================================================
 * 💬 หน้ากล่องข้อความและแชท (Direct Messages Inbox)
 * =========================================================================
 * 💡 อธิบายการทำงานแบบเข้าใจง่าย:
 * หน้ารวบรวมห้องแชททั้งหมด แสดงเฉพาะรายการแชทแบบคลีนๆ สไตล์ Instagram Direct
 * 
 * 📌 ฟังก์ชันหลัก:
 * 1. ช่องค้นหาบทสนทนา (Search Bar)
 * 2. รายการแชทพร้อม Avatar วงกลม, ชื่อคู่สนทนา, ชื่อสิ่งของ, และข้อความล่าสุด
 * 3. จุดสีฟ้า (Blue Unread Dot) แจ้งเตือนข้อความใหม่ (หายไปทันทีเมื่อกดอ่าน)
 * 4. แตะที่ห้องแชทเพื่อเปิดหน้าต่างคุยสด (`ChatScreen`) ได้ทันที
 * =========================================================================
 */

interface ChatListScreenProps {
  onOpenChat: (post: PostItem) => void;
  onNavigateToExplore: () => void;
}

export const ChatListScreen: React.FC<ChatListScreenProps> = ({
  onOpenChat,
  onNavigateToExplore,
}) => {
  const { conversations, refreshConversations, markChatAsRead, posts, user, isLoading } = useApp();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    refreshConversations();
  }, []);

  const handleSelectConversation = async (conv: ChatConversation) => {
    // เคลียร์สถานะการอ่านทันที เพื่อให้ Badge สีแดงด้านล่างหายไป
    await markChatAsRead(conv.postId);

    let targetPost = posts.find((p) => p.id === conv.postId);
    if (!targetPost) {
      targetPost = {
        id: conv.postId,
        type: 'found',
        title: conv.postTitle,
        category: 'สิ่งของ',
        color: 'ไม่ระบุ',
        location: 'มทส.',
        dateTime: conv.lastMessageAt,
        description: 'แชทเกี่ยวกับสิ่งของชิ้นนี้',
        imageUrl: conv.postImageUrl || '',
        status: 'found',
        userId: conv.otherUserId,
        userName: conv.otherUserName,
        userContact: '',
        userEmail: '',
        createdAt: conv.lastMessageAt,
      };
    }
    onOpenChat(targetPost);
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const now = new Date().getTime();
      const diff = now - new Date(dateString).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'เมื่อสักครู่';
      if (mins < 60) return `${mins} นาที`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} ชม.`;
      const days = Math.floor(hours / 24);
      return `${days} วัน`;
    } catch {
      return '';
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.postTitle.toLowerCase().includes(q) ||
      c.otherUserName.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshConversations}
            colors={[colors.primary]}
          />
        }
      >
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerUserWrap}>
            <Text style={[styles.usernameTitle, { color: colors.text }]}>
              {user?.fullName ? user.fullName.split(' ')[0] : 'SUT_Direct'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.text} style={{ marginLeft: 4 }} />
          </View>
          <View style={styles.headerRightBtns}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={onNavigateToExplore}>
              <Ionicons name="create-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Clean Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.borderLight }]}>
          <Ionicons name="search" size={17} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="ค้นหาข้อความ หรือชื่อสิ่งของ..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Section Header: Messages List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>กล่องข้อความทั้งหมด</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.primary }]}>
            {filteredConversations.length} แชท
          </Text>
        </View>

        {/* Clean IG-Style Direct Conversations List */}
        {filteredConversations.length > 0 ? (
          <View style={styles.conversationsList}>
            {filteredConversations.map((conv) => {
              const hasUnread = (conv.unreadCount || 0) > 0;

              return (
                <TouchableOpacity
                  key={conv.postId}
                  style={[
                    styles.conversationRow,
                    hasUnread && { backgroundColor: isDark ? 'rgba(251, 146, 60, 0.08)' : '#FFFBF5' },
                  ]}
                  onPress={() => handleSelectConversation(conv)}
                  activeOpacity={0.7}
                >
                  {/* Avatar Circle with Online Dot */}
                  <View style={styles.avatarContainer}>
                    {conv.postImageUrl ? (
                      <Image source={{ uri: conv.postImageUrl }} style={styles.avatarImg} />
                    ) : (
                      <View style={[styles.avatarFallback, { backgroundColor: colors.primaryBg }]}>
                        <Ionicons name="cube" size={24} color={colors.primary} />
                      </View>
                    )}
                    <View style={styles.onlineBadgeDot} />
                  </View>

                  {/* Message Information */}
                  <View style={styles.infoCol}>
                    <View style={styles.topInfoRow}>
                      <Text
                        style={[
                          styles.otherNameText,
                          { color: colors.text },
                          hasUnread && styles.unreadBold,
                        ]}
                        numberOfLines={1}
                      >
                        {conv.otherUserName}
                      </Text>
                      <Text style={[styles.timeAgoText, { color: hasUnread ? colors.primary : colors.textMuted }]}>
                        {formatRelativeTime(conv.lastMessageAt)}
                      </Text>
                    </View>

                    <Text
                      style={[styles.itemRefTitle, { color: colors.primary }]}
                      numberOfLines={1}
                    >
                      📦 {conv.postTitle}
                    </Text>

                    <View style={styles.bottomSnippetRow}>
                      <Text
                        style={[
                          styles.snippetText,
                          { color: hasUnread ? colors.text : colors.textSecondary },
                          hasUnread && styles.unreadBoldSnippet,
                        ]}
                        numberOfLines={1}
                      >
                        {conv.lastMessage}
                      </Text>

                      {/* IG Blue Unread Dot */}
                      {hasUnread && (
                        <View style={[styles.unreadDot, { backgroundColor: '#3B82F6' }]} />
                      )}
                    </View>
                  </View>

                  {/* Camera Quick Action (IG Style) */}
                  <TouchableOpacity
                    style={styles.cameraIconBtn}
                    onPress={() => handleSelectConversation(conv)}
                  >
                    <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          /* Empty State */
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryBg }]}>
              <Ionicons name="paper-plane-outline" size={38} color={colors.primary} />
            </View>
            <Text style={[styles.emptyHeading, { color: colors.text }]}>ยังไม่มีข้อความแชท</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              ส่งข้อความเพื่อนัดรับของ หรือสอบถามรายละเอียดสิ่งของได้โดยตรงจากหน้ากระดานประกาศ
            </Text>
            <TouchableOpacity
              style={[styles.startChatBtn, { backgroundColor: colors.primary }]}
              onPress={onNavigateToExplore}
              activeOpacity={0.85}
            >
              <Text style={styles.startChatBtnText}>ค้นหาของเพื่อเริ่มแชท</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerUserWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  conversationsList: {
    marginTop: 4,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadgeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  otherNameText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  timeAgoText: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemRefTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  bottomSnippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snippetText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 17,
  },
  unreadBold: {
    fontWeight: '800',
  },
  unreadBoldSnippet: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginLeft: 8,
  },
  cameraIconBtn: {
    padding: 6,
    marginLeft: 8,
  },
  emptyBox: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  startChatBtn: {
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 14,
  },
  startChatBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
