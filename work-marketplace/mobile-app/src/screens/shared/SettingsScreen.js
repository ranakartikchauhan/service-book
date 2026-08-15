import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import { COLORS, SHADOWS } from '../../theme';

export default function SettingsScreen({ navigation }) {
  const { user, logout, switchMode } = useAuth();
  const { language, changeLanguage, t } = useTranslation();
  const [switching, setSwitching] = useState(false);

  const handleModeSwitch = async () => {
    const nextMode = user?.currentMode === 'worker' ? 'poster' : 'worker';
    setSwitching(true);
    try {
      await switchMode(nextMode);
      Alert.alert(
        'Mode Switched 🎉',
        `You are now in ${nextMode.toUpperCase()} mode.`,
        [
          {
            text: nextMode === 'worker' ? 'Go to Find Work' : 'Go to My Jobs',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.popToTop();
              }
              navigation.navigate(nextMode === 'worker' ? 'WorkerTabs' : 'PosterTabs');
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Could not switch mode.');
    } finally {
      setSwitching(false);
    }
  };

  const handleSelectLanguage = () => {
    Alert.alert(
      t('select_language'),
      'Choose your preferred interface language / अपनी भाषा चुनें',
      [
        { text: 'English', onPress: () => changeLanguage('en') },
        { text: 'हिंदी (Hindi)', onPress: () => changeLanguage('hi') },
        { text: t('cancel'), style: 'cancel' },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of WorkMarket?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout }
    ]);
  };

  const navigateToHome = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(user?.currentMode === 'worker' ? 'Jobs' : 'MyJobs');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* QUICK HOME RETURN BAR */}
      <TouchableOpacity
        style={styles.backHomeBtn}
        onPress={navigateToHome}
        activeOpacity={0.7}
      >
        <Ionicons name="home-outline" size={16} color={COLORS.primaryLight} />
        <Text style={styles.backHomeTxt}>
          {user?.currentMode === 'worker' ? 'Go to Browse Jobs' : 'Go to My Posted Jobs'}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.primaryLight} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      {/* PROFILE HERO HEADER */}
      <View style={[styles.profileHeader, SHADOWS.medium]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userPhone}>{user?.phone}</Text>
        <View style={styles.modeBadge}>
          <Ionicons name="sparkles" size={12} color={COLORS.primaryLight} />
          <Text style={styles.modeBadgeText}>
            {user?.currentMode?.toUpperCase()} MODE
          </Text>
        </View>
      </View>

      {/* ACCOUNT & SERVICES */}
      <View style={[styles.card, SHADOWS.small]}>
        <Text style={styles.sectionTitle}>Account & Services</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleModeSwitch}
          disabled={switching}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="swap-horizontal" size={20} color={COLORS.primaryLight} />
          </View>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.actionTitle}>
              Switch to {user?.currentMode === 'worker' ? 'Poster' : 'Worker'} Mode
            </Text>
            <Text style={styles.actionSub}>
              {user?.currentMode === 'worker'
                ? 'Post jobs and hire trusted workers'
                : 'Find and apply for nearby service jobs'}
            </Text>
          </View>
          {switching ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('Subscription')}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="card-outline" size={20} color={COLORS.accent} />
          </View>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.actionTitle}>Subscriptions & Pricing</Text>
            <Text style={styles.actionSub}>
              {user?.currentMode === 'worker'
                ? 'Upgrade to Worker Pro for boost & unlimited applications'
                : 'Upgrade to Poster Business for priority matching'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('NotificationPreferences')}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.warning} />
          </View>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.actionTitle}>{t('notification_preferences')}</Text>
            <Text style={styles.actionSub}>Granular alert switches & quiet hours schedule</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('EmergencyContact')}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.success} />
          </View>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.actionTitle}>{t('emergency_contacts')}</Text>
            <Text style={styles.actionSub}>Configure trusted contacts for SOS alert dispatch</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleSelectLanguage}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="globe-outline" size={20} color={COLORS.primaryLight} />
          </View>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.actionTitle}>{t('language')}</Text>
            <Text style={styles.actionSub}>
              {language === 'hi' ? 'हिंदी (Hindi)' : 'English'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        {user?.currentMode === 'worker' && (
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('WorkerVerification')}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="ribbon-outline" size={20} color={COLORS.success} />
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.actionTitle}>ID Verification</Text>
              <Text style={styles.actionSub}>Upload government ID to unlock verified badge</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* PLATFORM & SAFETY INFO */}
      <View style={[styles.card, SHADOWS.small]}>
        <Text style={styles.sectionTitle}>Trust & Safety Info</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Platform</Text>
          <Text style={styles.infoValue}>WorkMarket v3.2.0</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Escrow Protection</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="lock-closed" size={13} color={COLORS.success} />
            <Text style={[styles.infoValue, { color: COLORS.success }]}>Active via Razorpay</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Safety Dispatch Support</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="shield" size={13} color={COLORS.danger} />
            <Text style={[styles.infoValue, { color: COLORS.danger }]}>24/7 Monitored</Text>
          </View>
        </View>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity
        style={[styles.logoutBtn, SHADOWS.small]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 18, paddingBottom: 40 },

  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  backHomeTxt: { color: COLORS.primaryLight, fontSize: 13, fontWeight: '800' },

  profileHeader: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: COLORS.surfaceLight,
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#FFFFFF' },
  userName: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  userPhone: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  modeBadgeText: { color: COLORS.primaryLight, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  actionSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, lineHeight: 16 },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  infoLabel: { color: COLORS.textSecondary, fontSize: 13 },
  infoValue: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
    marginBottom: 24,
  },
  logoutBtnText: { color: COLORS.danger, fontSize: 15, fontWeight: '800' },
});
