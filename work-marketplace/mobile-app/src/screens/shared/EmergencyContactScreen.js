import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, ScrollView,
} from 'react-native';
import api from '../../api/client';
import { useTranslation } from '../../i18n';

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
      Alert.alert('✅ Saved', 'Your emergency contact has been configured for instant SOS dispatch.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save contact.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.shieldHeader}>
          <Text style={{ fontSize: 44, marginBottom: 8 }}>🛡️</Text>
          <Text style={styles.title}>Emergency Trusted Contact</Text>
          <Text style={styles.subtitle}>
            If you trigger the in-app SOS button during any active job session, this person will immediately receive your live GPS coordinates alongside our safety dispatch team.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Contact Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ramesh Kumar"
            placeholderTextColor="#64748b"
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
          />

          <Text style={styles.label}>Mobile Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. +91 98765 43210"
            placeholderTextColor="#64748b"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
          />

          <Text style={styles.label}>Relationship</Text>
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

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>{t('save')}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 20 },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  shieldHeader: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '800', color: '#f8fafc', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 19 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155' },
  label: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12 },
  input: { backgroundColor: '#334155', borderRadius: 10, padding: 14, color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#475569' },
  relationRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  relChip: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#334155', alignItems: 'center', borderWidth: 1, borderColor: '#475569' },
  relChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  relChipText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  relChipTextActive: { color: 'white' },
  saveBtn: { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
});
