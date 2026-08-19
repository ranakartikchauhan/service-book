import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme';

/**
 * VoiceNotePlayer — stub component (audio playback coming soon)
 * expo-av removed due to RN 0.86 incompatibility. This placeholder
 * keeps the UI intact without crashing the app.
 */
export default function VoiceNotePlayer({ url, durationSec = 0, title = 'Audio Instructions' }) {
  return (
    <View style={[styles.container, SHADOWS.small]}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Ionicons name="mic" size={13} color="#FFFFFF" />
          <Text style={styles.badgeText}>Voice Note</Text>
        </View>
        <Text style={styles.instructionPrompt}>🗣️ Suniye (Listen to Client)</Text>
      </View>

      <View style={styles.playerControls}>
        <View style={styles.playBtnDisabled}>
          <Ionicons name="play" size={20} color="#64748b" />
        </View>

        <View style={styles.progressContainer}>
          {/* Static wave bars */}
          <View style={styles.waveBarContainer}>
            {[18, 28, 14, 32, 22, 36, 16, 26, 34, 18, 30, 20, 36, 14, 28, 22, 34, 16].map((h, i) => (
              <View key={i} style={[styles.waveBar, { height: h }]} />
            ))}
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeText}>0:00</Text>
            <Text style={styles.timeText}>
              {durationSec > 0 ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}` : '--:--'}
            </Text>
          </View>

          <Text style={styles.comingSoon}>🔊 Audio playback coming soon</Text>
        </View>
      </View>
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
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  instructionPrompt: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  playBtnDisabled: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  waveBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 38,
    paddingHorizontal: 4,
  },
  waveBar: {
    width: 3.5,
    borderRadius: 2,
    backgroundColor: '#334155',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  comingSoon: {
    marginTop: 6,
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
});
