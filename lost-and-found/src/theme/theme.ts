// ==========================================================
// SUT Lost & Found — Theme Color System
// ระบบสีสำหรับ Light/Dark Theme
// ==========================================================

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceHover: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Brand
  primary: string;
  primaryLight: string;
  primaryBg: string;
  primaryBorder: string;

  // Borders & Dividers
  border: string;
  borderLight: string;
  divider: string;

  // Header & Navigation
  headerGradientStart: string;
  headerGradientEnd: string;
  tabBarBg: string;
  tabBarBorder: string;

  // Status Colors
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;

  // Inputs
  inputBg: string;
  inputBorder: string;
  inputText: string;
  placeholder: string;

  // Cards & Shadows
  cardBg: string;
  cardBorder: string;
  shadowColor: string;

  // Overlays
  overlay: string;
  modalBg: string;

  // Chat
  chatBubbleMine: string;
  chatBubbleOther: string;
  chatBubbleTextMine: string;
  chatBubbleTextOther: string;
  chatInputBg: string;

  // Misc
  skeleton: string;
  badge: string;
}

export const lightColors: ThemeColors = {
  // Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  surfaceHover: '#F8FAFC',

  // Text
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Brand (SUT Orange)
  primary: '#EA580C',
  primaryLight: '#FB923C',
  primaryBg: '#FFF7ED',
  primaryBorder: '#FFEDD5',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#EEEEEE',

  // Header & Navigation
  headerGradientStart: '#1E293B',
  headerGradientEnd: '#0F172A',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#F1F5F9',

  // Status Colors
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  info: '#3B82F6',
  infoBg: '#EFF6FF',

  // Inputs
  inputBg: '#F8FAFC',
  inputBorder: '#E2E8F0',
  inputText: '#0F172A',
  placeholder: '#94A3B8',

  // Cards & Shadows
  cardBg: '#FFFFFF',
  cardBorder: '#F1F5F9',
  shadowColor: '#0F172A',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  modalBg: '#FFFFFF',

  // Chat
  chatBubbleMine: '#EA580C',
  chatBubbleOther: '#F1F5F9',
  chatBubbleTextMine: '#FFFFFF',
  chatBubbleTextOther: '#0F172A',
  chatInputBg: '#F8FAFC',

  // Misc
  skeleton: '#E2E8F0',
  badge: '#EF4444',
};

export const darkColors: ThemeColors = {
  // Backgrounds
  background: '#0F172A',
  surface: '#1E293B',
  surfaceAlt: '#334155',
  surfaceHover: '#334155',

  // Text
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // Brand (SUT Orange — สว่างขึ้นสำหรับ Dark Mode)
  primary: '#FB923C',
  primaryLight: '#FDBA74',
  primaryBg: 'rgba(251, 146, 60, 0.15)',
  primaryBorder: 'rgba(251, 146, 60, 0.3)',

  // Borders & Dividers
  border: '#334155',
  borderLight: '#1E293B',
  divider: '#334155',

  // Header & Navigation
  headerGradientStart: '#0F172A',
  headerGradientEnd: '#020617',
  tabBarBg: '#1E293B',
  tabBarBorder: '#334155',

  // Status Colors
  danger: '#F87171',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  success: '#34D399',
  successBg: 'rgba(16, 185, 129, 0.15)',
  warning: '#FBBF24',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  info: '#60A5FA',
  infoBg: 'rgba(59, 130, 246, 0.15)',

  // Inputs
  inputBg: '#334155',
  inputBorder: '#475569',
  inputText: '#F1F5F9',
  placeholder: '#64748B',

  // Cards & Shadows
  cardBg: '#1E293B',
  cardBorder: '#334155',
  shadowColor: '#000000',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  modalBg: '#1E293B',

  // Chat
  chatBubbleMine: '#FB923C',
  chatBubbleOther: '#334155',
  chatBubbleTextMine: '#0F172A',
  chatBubbleTextOther: '#F1F5F9',
  chatInputBg: '#334155',

  // Misc
  skeleton: '#334155',
  badge: '#EF4444',
};
