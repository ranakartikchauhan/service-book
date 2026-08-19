import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme';

/**
 * VoiceNoteRecorder — stub component (audio recording coming soon)
 * expo-av removed due to RN 0.86 incompatibility. This placeholder
 * keeps the UI intact without crashing the app.
 */
export default function VoiceNoteRecorder({ onAudioRecorded, initialAudio = null, onRemoveAudio }) {
  const handlePress = () => {
    Alert.alert(
      'Voice Notes — Coming Soon',
      'Audio recording will be available in the next update.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, SHADOWS.small]}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="mic" size={18} color={COLORS.primaryLight} />
          <Text style={styles.title}>Voice Instructions for Workers</Text>
        </View>
        <Text style={styles.subtitle}>Hindi / English Audio Note</Text>
      </View>

      <Text style={styles.helperText}>
        Workers who cannot read easily can listen to your voice note to understand the exact work requirements.
      </Text>

      <TouchableOpacity style={styles.recordBtn} onPress={handlePress} activeOpacity={0.8}>
        <Ionicons name="mic-outline" size={22} color="#FFFFFF" />
        <Text style={styles.recordBtnText}>Record Voice Note</Text>
      </TouchableOpacity>

      <Text style={styles.comingSoon}>🎤 Feature coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  helperText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17,
    marginBottom: 14,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#334155',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  recordBtnText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 13,
  },
  comingSoon: {
    marginTop: 10,
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
});
