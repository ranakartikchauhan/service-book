import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { user, logout, switchMode } = useAuth();
  const [switching, setSwitching] = useState(false);

  const handleModeSwitch = async () => {
    const nextMode = user?.currentMode === 'worker' ? 'poster' : 'worker';
    setSwitching(true);
    try {
      await switchMode(nextMode);
      Alert.alert('Mode Switched', `You are now in ${nextMode.toUpperCase()} mode.`);
    } catch (err) {
      Alert.alert('Error', 'Could not switch mode.');
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of WorkMarket?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userPhone}>{user?.phone}</Text>
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>
            CURRENT MODE: {user?.currentMode?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account & Mode</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleModeSwitch}
          disabled={switching}
        >
          <View>
            <Text style={styles.actionTitle}>
              Switch to {user?.currentMode === 'worker' ? 'Poster' : 'Worker'} Mode
            </Text>
            <Text style={styles.actionSub}>
              {user?.currentMode === 'worker'
                ? 'Switch to posting jobs and hiring workers'
                : 'Switch to finding and applying for jobs'}
            </Text>
          </View>
          {switching ? (
            <ActivityIndicator color="#6366f1" />
          ) : (
            <Text style={styles.actionArrow}>⇄</Text>
          )}
        </TouchableOpacity>

        {user?.currentMode === 'worker' && (
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('WorkerVerification')}
          >
            <View>
              <Text style={styles.actionTitle}>ID Verification</Text>
              <Text style={styles.actionSub}>Upload government ID to unlock applying to jobs</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>App Info & Safety</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Platform</Text>
          <Text style={styles.infoValue}>WorkMarket v1.0.0 (MVP)</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Escrow Protection</Text>
          <Text style={[styles.infoValue, { color: '#4ade80' }]}>Active via Razorpay</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Safety Support (SOS)</Text>
          <Text style={[styles.infoValue, { color: '#ef4444' }]}>24/7 Monitored</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: 'white' },
  userName: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  userPhone: { fontSize: 14, color: '#94a3b8', marginTop: 2 },
  modeBadge: {
    backgroundColor: '#312e81', paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 999, marginTop: 10
  },
  modeBadgeText: { color: '#a5b4fc', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  card: {
    backgroundColor: '#1e293b', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#334155', marginBottom: 16
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155'
  },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  actionSub: { fontSize: 12, color: '#64748b', marginTop: 2, maxWidth: 260 },
  actionArrow: { fontSize: 20, color: '#6366f1', fontWeight: '800' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  infoLabel: { color: '#94a3b8', fontSize: 14 },
  infoValue: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: '#ef4444',
    borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 32
  },
  logoutBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
});
