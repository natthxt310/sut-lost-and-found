// ==========================================================
// SUT Lost & Found — SUT Orange Theme System (Mockup Design)
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

  // Brand (SUT Signature Orange)
  primary: string;
  primaryLight: string;
  primaryDark: string;
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
  tabBarActive: string;
  tabBarInactive: string;

  // Status & Action Colors
  danger: string;
  dangerBg: string;
  dangerLight: string;
  success: string;
  successBg: string;
  successLight: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
  actionBlue: string;
  actionGreen: string;

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

  // Chat (Blue & Grey as per mockup)
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
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  surfaceHover: '#F1F5F9',

  // Text
  text: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Brand (SUT Orange #FF7A00)
  primary: '#FF7A00',
  primaryLight: '#FFA040',
  primaryDark: '#E56B00',
  primaryBg: '#FFF7ED',
  primaryBorder: '#FFEDD5',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#F1F5F9',

  // Header & Navigation
  headerGradientStart: '#FF8800',
  headerGradientEnd: '#FF5500',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: '#FF7A00',
  tabBarInactive: '#1E293B',

  // Status Colors
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  dangerLight: '#FFEAEA',
  success: '#10B981',
  successBg: '#DCFCE7',
  successLight: '#E8F8F0',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  info: '#0055D4',
  infoBg: '#EFF6FF',
  actionBlue: '#0055D4',
  actionGreen: '#10B981',

  // Inputs
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  inputText: '#0F172A',
  placeholder: '#94A3B8',

  // Cards & Shadows
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  shadowColor: 'rgba(0, 0, 0, 0.08)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  modalBg: '#FFFFFF',

  // Chat
  chatBubbleMine: '#0055D4',
  chatBubbleOther: '#E2E8F0',
  chatBubbleTextMine: '#FFFFFF',
  chatBubbleTextOther: '#1E293B',
  chatInputBg: '#FFFFFF',

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
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // Brand (SUT Orange for Dark Mode)
  primary: '#FF7A00',
  primaryLight: '#FFA040',
  primaryDark: '#E56B00',
  primaryBg: 'rgba(255, 122, 0, 0.15)',
  primaryBorder: 'rgba(255, 122, 0, 0.3)',

  // Borders & Dividers
  border: '#334155',
  borderLight: '#1E293B',
  divider: '#334155',

  // Header & Navigation
  headerGradientStart: '#FF7A00',
  headerGradientEnd: '#E56B00',
  tabBarBg: '#1E293B',
  tabBarBorder: '#334155',
  tabBarActive: '#FF7A00',
  tabBarInactive: '#94A3B8',

  // Status Colors
  danger: '#F87171',
  dangerBg: 'rgba(239, 68, 68, 0.2)',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  success: '#34D399',
  successBg: 'rgba(16, 185, 129, 0.2)',
  successLight: 'rgba(16, 185, 129, 0.15)',
  warning: '#FBBF24',
  warningBg: 'rgba(245, 158, 11, 0.2)',
  info: '#38BDF8',
  infoBg: 'rgba(56, 189, 248, 0.2)',
  actionBlue: '#2563EB',
  actionGreen: '#10B981',

  // Inputs
  inputBg: '#1E293B',
  inputBorder: '#475569',
  inputText: '#F8FAFC',
  placeholder: '#64748B',

  // Cards & Shadows
  cardBg: '#1E293B',
  cardBorder: '#334155',
  shadowColor: 'rgba(0, 0, 0, 0.5)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  modalBg: '#1E293B',

  // Chat
  chatBubbleMine: '#0055D4',
  chatBubbleOther: '#334155',
  chatBubbleTextMine: '#FFFFFF',
  chatBubbleTextOther: '#F8FAFC',
  chatInputBg: '#1E293B',

  // Misc
  skeleton: '#334155',
  badge: '#EF4444',
};
