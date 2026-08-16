import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/client';
import { useTranslation } from '../../i18n';

const CATEGORIES_CONFIG = [
  { key: 'newMatchingJob', label: 'Matching Jobs Near Me', desc: 'Instant alerts when jobs matching your skills are posted nearby' },
  { key: 'applicationUpdates', label: 'Application Status', desc: 'When your job proposal is accepted, shortlisted, or reviewed' },
  { key: 'messages', label: 'Direct Messages', desc: 'Instant push notifications for new in-app chat messages' },
  { key: 'paymentUpdates', label: 'Payment & Escrow Releases', desc: 'Deposits, escrow locks, and direct bank/UPI payout alerts' },
  { key: 'jobReminders', label: 'Job Start Reminders', desc: 'Reminders 1 hour before scheduled start times' },
  { key: 'noApplicantsNudge', label: 'Post Optimization Tips', desc: 'Helpful nudges if your job needs a budget tweak' },
  { key: 'subscriptionBilling', label: 'Subscription & Invoices', desc: 'Renewal reminders and subscription receipts' },
  { key: 'marketing', label: 'Promotions & Platform News', desc: 'Occasional product updates and bonus earning opportunities' },
];

export default function NotificationPreferencesScreen() {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data } = await api.get('/notifications/preferences');
        setPreferences(data.data.preferences);
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const handleToggleCategory = (categoryKey, value) => {
    setPreferences((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryKey]: value ? 'instant' : 'off',
      },
    }));
  };

  const handleToggleQuietHours = (value) => {
    setPreferences((prev) => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/notifications/preferences', preferences);
      Alert.alert('Saved', 'Your notification preferences have been updated.');
    } catch (err) {
      Alert.alert('Error', 'Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !preferences) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionHeader}>Granular Notification Controls</Text>
        <Text style={styles.sectionSub}>
          Customize exactly which notifications you receive as instant push interruptions vs. silent in-app updates.
        </Text>

        {/* CATEGORY SWITCHES */}
        <View style={styles.card}>
          {CATEGORIES_CONFIG.map((cat, idx) => {
            const isEnabled = preferences.categories?.[cat.key] !== 'off';
            return (
              <View
                key={cat.key}
                style={[
                  styles.prefRow,
                  idx < CATEGORIES_CONFIG.length - 1 && styles.borderBottom,
                ]}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.prefLabel}>{cat.label}</Text>
                  <Text style={styles.prefDesc}>{cat.desc}</Text>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={(val) => handleToggleCategory(cat.key, val)}
                  trackColor={{ false: '#334155', true: '#6366f1' }}
                  thumbColor="white"
                />
              </View>
            );
          })}
        </View>

        {/* QUIET HOURS */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Quiet Hours</Text>
        <Text style={styles.sectionSub}>
          Silence all non-emergency push notifications during your resting hours (10:00 PM to 07:00 AM).
        </Text>

        <View style={styles.card}>
          <View style={styles.prefRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefLabel}>Enable Quiet Hours</Text>
              <Text style={styles.prefDesc}>10:00 PM – 07:00 AM (Emergency SOS will still alert)</Text>
            </View>
            <Switch
              value={Boolean(preferences.quietHours?.enabled)}
              onValueChange={handleToggleQuietHours}
              trackColor={{ false: '#334155', true: '#6366f1' }}
              thumbColor="white"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>{t('save')}</Text>}
        </TouchableOpacity>

        {/* DEVICE PUSH TOKEN DIAGNOSTICS */}
        <View style={[styles.card, { marginTop: 24, padding: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
            <Text style={{ color: '#f8fafc', fontWeight: '800', fontSize: 13 }}>Push Notifications Diagnostics</Text>
          </View>
          <Text style={{ color: '#94a3b8', fontSize: 12, lineHeight: 17, marginBottom: 12 }}>
            Tap below to test push notification connection and register this device token with the server.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#3b82f6',
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 8,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
            }}
            onPress={async () => {
              try {
                const { registerForPushNotificationsAsync } = require('../../utils/notifications');
                const token = await registerForPushNotificationsAsync();
                if (token) {
                  Alert.alert('✅ Device Registered!', `Push Token synced successfully:\n\n${token.slice(0, 30)}...`);
                } else {
                  Alert.alert('Permission Needed', 'Please allow notifications in your phone Settings -> Apps -> WorkMarket.');
                }
              } catch (e) {
                Alert.alert('Registration Error', e.message);
              }
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>Register & Sync Device Token</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: '#f8fafc', marginBottom: 4 },
  sectionSub: { fontSize: 13, color: '#94a3b8', lineHeight: 18, marginBottom: 14 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#334155' },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#334155' },
  prefLabel: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  prefDesc: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 16 },
  saveBtn: { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
});
