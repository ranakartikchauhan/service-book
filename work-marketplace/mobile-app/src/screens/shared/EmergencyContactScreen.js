import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { useTranslation } from '../../i18n';
import { COLORS, SHADOWS } from '../../theme';

export default function EmergencyContactScreen() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', phone: '', relationship: 'Family' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadContact = async () => {
      try {
        const { data } = await api.get('/safety/emergency-contact');
        if (data.data.contact) {
          setForm(data.data.contact);
        }
      } catch (err) {
        console.error('Error loading emergency contact:', err);
      } finally {
        setLoading(false);
      }
    };
    loadContact();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      return Alert.alert('Missing Details', 'Please provide a name and mobile number.');
    }
    setSaving(true);
    try {
      await api.put('/safety/emergency-contact', form);
      Alert.alert('Saved', 'Your emergency contact has been configured for instant SOS dispatch.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save contact.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.shieldHeader}>
          <View style={styles.shieldIconCircle}>
            <Ionicons name="shield-checkmark" size={36} color={COLORS.success} />
          </View>
          <Text style={styles.title}>Emergency Trusted Contact</Text>
          <Text style={styles.subtitle}>
            If you trigger the in-app SOS button during any active job session, this person will immediately receive your live GPS coordinates alongside our safety dispatch team.
          </Text>
        </View>

        <View style={[styles.card, SHADOWS.medium]}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.label}>Contact Full Name *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor={COLORS.textMuted}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="call-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.label}>Mobile Phone Number *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(v) => setForm({ ...form, phone: v })}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.label}>Relationship</Text>
            </View>
            <View style={styles.relationRow}>
              {['Family', 'Spouse', 'Friend', 'Colleague'].map((rel) => (
                <TouchableOpacity
                  key={rel}
                  style={[styles.relChip, form.relationship === rel && styles.relChipActive]}
                  onPress={() => setForm({ ...form, relationship: rel })}
                >
                  <Text style={[styles.relChipText, form.relationship === rel && styles.relChipTextActive]}>
                    {rel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled, SHADOWS.glowPrimary]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>{t('save')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20 },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  shieldHeader: { alignItems: 'center', marginBottom: 24 },
  shieldIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },

  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  inputGroup: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
  },

  relationRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  relChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
  },
  relChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  relChipText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  relChipTextActive: { color: '#FFFFFF' },

  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
