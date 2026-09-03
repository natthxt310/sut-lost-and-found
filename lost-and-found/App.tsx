import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider, useApp } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { ExploreBoardScreen } from './src/screens/ExploreBoardScreen';
import { NotificationScreen } from './src/screens/NotificationScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { CreatePostScreen } from './src/screens/CreatePostScreen';
import { PostDetailScreen } from './src/screens/PostDetailScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { MyPostsScreen } from './src/screens/MyPostsScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { AuthModal } from './src/screens/AuthModal';
import { InAppNotificationBanner } from './src/components/InAppNotificationBanner';
import { PostItem, PostType } from './src/types';

const Tab = createBottomTabNavigator();

// Placeholder for Middle Tab '+'
const EmptyScreen = () => <View style={{ flex: 1 }} />;

function MainAppContent() {
  const {
    unreadNotifsCount,
    markAllNotificationsAsRead,
    posts,
    user,
    isLoading,
    activeInAppBanner,
    dismissInAppBanner,
  } = useApp();
  const { colors, isDark } = useTheme();

  // Navigation Overlay States
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [selectedChatPost, setSelectedChatPost] = useState<PostItem | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<PostType>('lost');
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [myPostsVisible, setMyPostsVisible] = useState(false);
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [favoritesModalVisible, setFavoritesModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [searchCategory, setSearchCategory] = useState<string | undefined>(undefined);
  const [searchViewMode, setSearchViewMode] = useState<'map' | 'filter'>('filter');

  const openCreate = (type: PostType = 'lost') => {
    setCreateInitialType(type);
    setCreateModalVisible(true);
  };

  const renderHomeScreen = useCallback(({ navigation }: any) => (
    <HomeScreen
      onSelectPost={(post) => setSelectedPost(post)}
      onNavigateToCreate={(type) => openCreate(type)}
      onNavigateToSearch={(cat) => {
        setSearchCategory(cat);
        setSearchViewMode('filter');
        navigation.navigate('ค้นหา');
      }}
    />
  ), []);

  const renderExploreScreen = useCallback(() => (
    <ExploreBoardScreen
      onSelectPost={(post) => setSelectedPost(post)}
      initialCategory={searchCategory}
      initialViewMode={searchViewMode}
    />
  ), [searchCategory, searchViewMode]);

  const renderNotificationScreen = useCallback(() => (
    <NotificationScreen
      onSelectNotification={(n) => {
        const targetPost = posts.find((p) => p.id === n.sourcePostId || p.id === n.matchedPostId);
        if (targetPost) {
          if (n.type === 'message') {
            setSelectedChatPost(targetPost);
          } else {
            setSelectedPost(targetPost);
          }
        }
      }}
    />
  ), [posts]);

  const renderProfileScreen = useCallback(() => (
    <ProfileScreen
      onOpenMyPosts={() => setMyPostsVisible(true)}
      onOpenFavorites={() => setFavoritesModalVisible(true)}
      onOpenDashboard={() => {
        const isAdmin = user?.role === 'admin' || user?.studentId?.toUpperCase() === 'ADMIN' || user?.email?.toLowerCase().includes('admin');
        if (isAdmin) {
          setDashboardVisible(true);
        } else {
          Alert.alert('จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ 🛡️', 'เฉพาะบัญชี Admin เท่านั้นที่สามารถเข้าถึงแผงสถิติผู้ดูแลระบบได้');
        }
      }}
      onOpenAuth={() => setAuthModalVisible(true)}
    />
  ), [user]);

  // 1. สถานะกำลังโหลดข้อมูล
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color="#FF7A00" />
      </View>
    );
  }

  // 2. 🔒 บังคับให้เข้าสู่ระบบก่อนเข้าใช้งานแอป (ถ้ายังไม่ Login จะไม่สามารถเข้าดูแอปได้)
  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AuthModal
          visible={true}
          onClose={() => {}}
          allowDismiss={false}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#FF7A00',
            tabBarInactiveTintColor: colors.text,
            tabBarStyle: {
              height: Platform.OS === 'ios' ? 94 : 84,
              paddingTop: 8,
              paddingBottom: Platform.OS === 'ios' ? 30 : 20,
              backgroundColor: colors.tabBarBg,
              borderTopWidth: 1,
              borderTopColor: colors.tabBarBorder,
              elevation: 12,
              shadowColor: colors.shadowColor,
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
            tabBarItemStyle: {
              justifyContent: 'center',
              alignItems: 'center',
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '700',
              marginTop: 2,
            },
            tabBarIcon: ({ focused }) => {
              // 1. Center Plus Button
              if (route.name === 'สร้างโพสต์') {
                return (
                  <View style={styles.floatingPlusCircle}>
                    <Ionicons name="add" size={32} color="#FFFFFF" />
                  </View>
                );
              }

              let iconName: keyof typeof Ionicons.glyphMap = 'home';
              if (route.name === 'หน้าหลัก') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'ค้นหา') {
                iconName = focused ? 'search' : 'search-outline';
              } else if (route.name === 'แจ้งเตือน') {
                iconName = focused ? 'notifications' : 'notifications-outline';
              } else if (route.name === 'โปรไฟล์') {
                iconName = focused ? 'person' : 'person-outline';
              }

              return (
                <View style={styles.tabIconWrapper}>
                  <Ionicons
                    name={iconName}
                    size={24}
                    color={focused ? '#FF7A00' : colors.text}
                  />

                  {/* 🔔 Notification Badge */}
                  {route.name === 'แจ้งเตือน' && unreadNotifsCount > 0 && (
                    <View style={styles.tabBadgeRed}>
                      <Text style={styles.tabBadgeText}>
                        {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                      </Text>
                    </View>
                  )}
                </View>
              );
            },
          })}
        >
          {/* 1. หน้าหลัก (Home) */}
          <Tab.Screen name="หน้าหลัก" component={renderHomeScreen} />

          {/* 2. ค้นหา (Search / Explore) */}
          <Tab.Screen name="ค้นหา" component={renderExploreScreen} />

          {/* 3. ปุ่มส้มกลมตรงกลางขนาดใหญ่ '+' */}
          <Tab.Screen
            name="สร้างโพสต์"
            component={EmptyScreen}
            listeners={{
              tabPress: (e) => {
                e.preventDefault();
                openCreate('lost');
              },
            }}
            options={{
              tabBarLabel: () => null,
            }}
          />

          {/* 4. แจ้งเตือน (Notifications) */}
          <Tab.Screen name="แจ้งเตือน" component={renderNotificationScreen} />

          {/* 5. โปรไฟล์ (Profile) */}
          <Tab.Screen name="โปรไฟล์" component={renderProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>

      {/* ================= MODAL: POST DETAIL (ค้นหา-1.png) ================= */}
      <Modal visible={!!selectedPost} animationType="slide" transparent={false}>
        {selectedPost && (
          <PostDetailScreen
            post={selectedPost}
            onBack={() => setSelectedPost(null)}
            onOpenChat={(p) => {
              setSelectedPost(null);
              setSelectedChatPost(p);
            }}
            onEditPost={(p) => {
              setSelectedPost(null);
              setEditingPost(p);
            }}
          />
        )}
      </Modal>

      {/* ================= MODAL: CHAT ROOM (แชท.png) ================= */}
      <Modal visible={!!selectedChatPost} animationType="slide" transparent={false}>
        {selectedChatPost && (
          <ChatScreen
            post={selectedChatPost}
            onBack={() => setSelectedChatPost(null)}
          />
        )}
      </Modal>

      {/* ================= MODAL: CREATE / EDIT POST (โพสต์.png) ================= */}
      <Modal visible={createModalVisible || !!editingPost} animationType="slide" transparent={false}>
        <CreatePostScreen
          initialType={createInitialType}
          editingPost={editingPost}
          onBack={() => {
            setCreateModalVisible(false);
            setEditingPost(null);
          }}
          onSuccess={() => {
            setCreateModalVisible(false);
            setEditingPost(null);
          }}
        />
      </Modal>

      {/* ================= MODAL: MY POSTS (โพสต์ของฉัน.png, 1.png, 2.png) ================= */}
      <Modal visible={myPostsVisible} animationType="slide" transparent={false}>
        <MyPostsScreen
          onBack={() => setMyPostsVisible(false)}
          onSelectPost={(p) => {
            setMyPostsVisible(false);
            setSelectedPost(p);
          }}
          onEditPost={(p) => {
            setMyPostsVisible(false);
            setEditingPost(p);
          }}
        />
      </Modal>

      {/* ================= MODAL: DASHBOARD (แชท-1.png) ================= */}
      <Modal visible={dashboardVisible} animationType="slide" transparent={false}>
        <DashboardScreen onBack={() => setDashboardVisible(false)} />
      </Modal>

      {/* ================= MODAL: FAVORITES ================= */}
      <Modal visible={favoritesModalVisible} animationType="slide" transparent={false}>
        <FavoritesScreen
          onClose={() => setFavoritesModalVisible(false)}
          onSelectPost={(p) => {
            setFavoritesModalVisible(false);
            setSelectedPost(p);
          }}
        />
      </Modal>

      {/* ================= MODAL: AUTH / LOGIN (ลอกอิน.png) ================= */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />

      {/* 🔔 FLOATING IN-APP TOAST NOTIFICATION BANNER */}
      <InAppNotificationBanner
        notification={activeInAppBanner}
        onDismiss={dismissInAppBanner}
        onPress={(notif) => {
          dismissInAppBanner();
          const targetPost = posts.find((p) => p.id === notif.sourcePostId || p.id === notif.matchedPostId);
          if (targetPost) {
            if (notif.type === 'message') {
              setSelectedChatPost(targetPost);
            } else {
              setSelectedPost(targetPost);
            }
          }
        }}
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
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingPlusCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF7A00',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -22,
    elevation: 6,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  tabBadgeRed: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
