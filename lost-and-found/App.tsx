import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Platform, Dimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider, useApp } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { ExploreBoardScreen } from './src/screens/ExploreBoardScreen';
import { ChatListScreen } from './src/screens/ChatListScreen';
import { CreatePostScreen } from './src/screens/CreatePostScreen';
import { PostDetailScreen } from './src/screens/PostDetailScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { NotificationScreen } from './src/screens/NotificationScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthModal } from './src/screens/AuthModal';
import { ChatScreen } from './src/screens/ChatScreen';
import { PostItem, PostType } from './src/types';

/**
 * =========================================================================
 * 📱 SUT Lost & Found — Instagram Style Architecture
 * =========================================================================
 * 💡 อธิบายโครงสร้างแท็บเมนูสไตล์ IG (5 Tabs Bottom Navigation):
 * 1. 🏠 "หน้าหลัก" (Home)
 * 2. 🔍 "ค้นหา/บอร์ด" (Explore)
 * 3. 💬 "แชท" (Direct Messages) พร้อม Badge ตัวเลข (เคลียร์หายทันทีเมื่ออ่าน)
 * 4. 🔔 "แจ้งเตือน" (Activity Feed)
 * 5. 👤 "โปรไฟล์" (Profile Circle)
 * =========================================================================
 */

const Tab = createBottomTabNavigator();

interface SUTHeaderProps {
  onOpenFav: () => void;
  onOpenCreate: () => void;
  onOpenAuth: () => void;
  onOpenDirect: () => void;
  unreadChatCount: number;
}

const SUTHeader: React.FC<SUTHeaderProps> = ({
  onOpenFav,
  onOpenCreate,
  onOpenAuth,
  onOpenDirect,
  unreadChatCount,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: colors.modalBg }}>
      <View style={[styles.topHeader, { backgroundColor: colors.modalBg, borderBottomColor: colors.borderLight }]}>
        {/* IG Style Logo Branding */}
        <View style={styles.brandContainer}>
          <View style={[styles.sutBadgeWrap, { backgroundColor: colors.primary }]}>
            <Text style={styles.sutBadgeText}>SUT</Text>
          </View>
          <Text style={[styles.headerTitleIG, { color: colors.text }]}>Lost & Found</Text>
        </View>

        {/* IG Style Top Right Icons (Heart & Direct Messages) */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={onOpenFav}
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={onOpenDirect}
            activeOpacity={0.7}
          >
            <Ionicons name="paper-plane-outline" size={23} color={colors.text} />
            {unreadChatCount > 0 && (
              <View style={styles.headerDmBadge}>
                <Text style={styles.headerDmBadgeText}>
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={onOpenAuth}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle-outline" size={26} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

function MainAppContent() {
  const { unreadNotifsCount, unreadChatCount, markAllNotificationsAsRead } = useApp();
  const { colors, isDark } = useTheme();

  // Navigation Overlay States
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [selectedChatPost, setSelectedChatPost] = useState<PostItem | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<PostType>('lost');
  const [favoritesModalVisible, setFavoritesModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const openCreateModal = (type: PostType = 'lost') => {
    setCreateInitialType(type);
    setCreateModalVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* 5-Tab Modern Instagram-Style Navigation */}
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: true,
            header: () => (
              <SUTHeader
                onOpenFav={() => setFavoritesModalVisible(true)}
                onOpenCreate={() => openCreateModal('lost')}
                onOpenAuth={() => setAuthModalVisible(true)}
                onOpenDirect={() => {
                  // Direct shortcut
                }}
                unreadChatCount={unreadChatCount}
              />
            ),
            tabBarActiveTintColor: colors.text,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: {
              height: Platform.OS === 'ios' ? 88 : 78,
              paddingTop: 8,
              paddingBottom: Platform.OS === 'ios' ? 28 : 18,
              backgroundColor: colors.tabBarBg,
              borderTopWidth: 1,
              borderTopColor: colors.tabBarBorder,
              elevation: 8,
              shadowColor: colors.shadowColor,
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
            },
            tabBarItemStyle: {
              justifyContent: 'center',
              alignItems: 'center',
            },
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '700' as const,
              marginTop: 2,
            },
            tabBarIcon: ({ focused }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'home';

              if (route.name === 'หน้าหลัก') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'ค้นหา/บอร์ด') {
                iconName = focused ? 'search' : 'search-outline';
              } else if (route.name === 'แชท') {
                iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
              } else if (route.name === 'แจ้งเตือน') {
                iconName = focused ? 'notifications' : 'notifications-outline';
              } else if (route.name === 'โปรไฟล์') {
                iconName = focused ? 'person' : 'person-outline';
              }

              return (
                <View style={[styles.tabIconWrapper, focused && { backgroundColor: colors.primaryBg }]}>
                  <Ionicons
                    name={iconName}
                    size={23}
                    color={focused ? colors.primary : colors.textMuted}
                  />

                  {/* 🔔 Badge สำหรับแจ้งเตือน (หายไปทันทีเมื่ออ่าน) */}
                  {route.name === 'แจ้งเตือน' && unreadNotifsCount > 0 && (
                    <View style={styles.tabBadgeRed}>
                      <Text style={styles.tabBadgeText}>
                        {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                      </Text>
                    </View>
                  )}

                  {/* 💬 Badge สำหรับแชท (หายไปทันทีเมื่อเปิดอ่าน) */}
                  {route.name === 'แชท' && unreadChatCount > 0 && (
                    <View style={styles.tabBadgeRed}>
                      <Text style={styles.tabBadgeText}>
                        {unreadChatCount > 9 ? '9+' : unreadChatCount}
                      </Text>
                    </View>
                  )}
                </View>
              );
            },
          })}
        >
          {/* แท็บ 1: หน้าหลัก */}
          <Tab.Screen name="หน้าหลัก">
            {() => (
              <HomeScreen
                onSelectPost={(post) => setSelectedPost(post)}
                onNavigateToCreate={(type) => openCreateModal(type)}
              />
            )}
          </Tab.Screen>

          {/* แท็บ 2: ค้นหา / บอร์ดประกาศรวม */}
          <Tab.Screen name="ค้นหา/บอร์ด">
            {() => (
              <ExploreBoardScreen
                onSelectPost={(post) => setSelectedPost(post)}
                onNavigateToCreate={(type) => openCreateModal(type)}
              />
            )}
          </Tab.Screen>

          {/* แท็บ 3: กล่องข้อความสไตล์ IG DM */}
          <Tab.Screen name="แชท">
            {() => (
              <ChatListScreen
                onOpenChat={(post) => setSelectedChatPost(post)}
                onNavigateToExplore={() => {
                  // Direct navigation
                }}
              />
            )}
          </Tab.Screen>

          {/* แท็บ 4: การแจ้งเตือน (เคลียร์ Badge ทันทีเมื่อเปิด) */}
          <Tab.Screen
            name="แจ้งเตือน"
            listeners={{
              tabPress: () => {
                markAllNotificationsAsRead();
              },
            }}
          >
            {() => (
              <NotificationScreen
                onSelectNotification={(n) => {
                  // select notification
                }}
              />
            )}
          </Tab.Screen>

          {/* แท็บ 5: โปรไฟล์ */}
          <Tab.Screen name="โปรไฟล์">
            {() => (
              <ProfileScreen
                onSelectPost={(post) => setSelectedPost(post)}
                onOpenAuth={() => setAuthModalVisible(true)}
                onOpenFavorites={() => setFavoritesModalVisible(true)}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>

      {/* Modal หน้าต่างสร้างโพสต์ใหม่ */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.modalBg }}>
          <View style={[styles.modalTopNav, { borderBottomColor: colors.borderLight, backgroundColor: colors.modalBg }]}>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={{ padding: 6 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTopTitle, { color: colors.text }]}>
              {createInitialType === 'lost' ? 'สร้างโพสต์แจ้งของหาย' : 'สร้างโพสต์แจ้งพบของ'}
            </Text>
            <View style={{ width: 32 }} />
          </View>
          <CreatePostScreen
            initialType={createInitialType}
            onSuccess={() => setCreateModalVisible(false)}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal หน้ารายละเอียดโพสต์ (PostDetailScreen) */}
      <Modal
        visible={!!selectedPost}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedPost(null)}
      >
        {selectedPost && (
          <PostDetailScreen
            post={selectedPost}
            onBack={() => setSelectedPost(null)}
            onSelectMatchedPost={(matched) => setSelectedPost(matched)}
            onOpenChat={(post) => setSelectedChatPost(post)}
          />
        )}
      </Modal>

      {/* Modal หน้ารายการโปรด (Favorites Modal) */}
      <Modal
        visible={favoritesModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setFavoritesModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.modalBg }}>
          <View style={[styles.modalTopNav, { borderBottomColor: colors.borderLight, backgroundColor: colors.modalBg }]}>
            <TouchableOpacity onPress={() => setFavoritesModalVisible(false)} style={{ padding: 6 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTopTitle, { color: colors.text }]}>รายการที่บันทึกไว้ (Favorites)</Text>
            <View style={{ width: 32 }} />
          </View>
          <FavoritesScreen
            onSelectPost={(post) => {
              setFavoritesModalVisible(false);
              setSelectedPost(post);
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal หน้าต่างแชท (ChatScreen) */}
      <Modal
        visible={!!selectedChatPost}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedChatPost(null)}
      >
        {selectedChatPost && (
          <ChatScreen
            post={selectedChatPost}
            onBack={() => setSelectedChatPost(null)}
          />
        )}
      </Modal>

      {/* Modal หน้าต่างเข้าสู่ระบบ (AuthModal) */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <MainAppContent />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sutBadgeWrap: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sutBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerTitleIG: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIconBtn: {
    position: 'relative',
    padding: 2,
  },
  headerDmBadge: {
    position: 'absolute',
    top: -3,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerDmBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabIconWrapper: {
    width: 44,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabBadgeRed: {
    position: 'absolute',
    top: -3,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  modalTopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTopTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
});
