import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { COLORS, SHADOWS } from '../theme';

/**
 * VoiceNotePlayer — Audio player component for listening to voice instructions.
 * Uses expo-audio useAudioPlayer hook with playback controls and animated waveform.
 */
export default function VoiceNotePlayer({ url, durationSec = 0, title = 'Audio Instructions' }) {
  const player = useAudioPlayer(url || '');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (player) {
      setIsPlaying(player.playing);
    }
  }, [player?.playing]);

  const togglePlayback = () => {
    if (!player) return;
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (sec) => {
    if (!sec || sec <= 0) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

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
        <TouchableOpacity
          style={[styles.playBtn, isPlaying && styles.playBtnActive]}
          onPress={togglePlayback}
          activeOpacity={0.8}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          {/* Waveform bars */}
          <View style={styles.waveBarContainer}>
            {[18, 28, 14, 32, 22, 36, 16, 26, 34, 18, 30, 20, 36, 14, 28, 22, 34, 16].map((h, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  { height: h },
                  isPlaying && (i % 2 === 0 ? styles.waveActive1 : styles.waveActive2),
                ]}
              />
            ))}
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{isPlaying ? 'Playing...' : '0:00'}</Text>
            <Text style={styles.timeText}>{formatTime(durationSec)}</Text>
          </View>
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
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: {
    backgroundColor: '#ef4444',
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
  waveActive1: {
    backgroundColor: COLORS.primaryLight,
  },
  waveActive2: {
    backgroundColor: '#818cf8',
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
});
