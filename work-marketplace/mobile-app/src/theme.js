export const COLORS = {
  background: '#0B0F19',
  surface: '#131B2E',
  surfaceLight: '#1E293B',
  surfaceBorder: '#27354E',
  surfaceBorderLight: '#334155',

  primary: '#6366F1',
  primaryGradient: ['#6366F1', '#8B5CF6'],
  primaryLight: '#818CF8',
  primaryGlow: 'rgba(99, 102, 241, 0.25)',

  accent: '#38BDF8',
  success: '#10B981',
  successLight: '#34D399',
  successGlow: 'rgba(16, 185, 129, 0.2)',

  warning: '#F59E0B',
  danger: '#EF4444',
  dangerGradient: ['#EF4444', '#DC2626'],
  dangerGlow: 'rgba(239, 68, 68, 0.25)',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDim: '#475569',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  glowPrimary: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
};
