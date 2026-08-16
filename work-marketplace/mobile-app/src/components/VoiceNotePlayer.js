import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme';

export default function VoiceNotePlayer({ url, durationSec = 0, title = 'Audio Instructions' }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState((durationSec || 0) * 1000);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPositionMillis(status.positionMillis);
      setDurationMillis(status.durationMillis || (durationSec * 1000));
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPositionMillis(0);
      }
    } else if (status.error) {
      console.error('Playback error:', status.error);
      setIsPlaying(false);
    }
  };

  const handlePlayPause = async () => {
    if (!url) return;

    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          if (positionMillis >= durationMillis && durationMillis > 0) {
            await sound.replayAsync();
          } else {
            await sound.playAsync();
          }
        }
      } else {
        setLoading(true);
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progressPercent = durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0;

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
          style={styles.playBtn}
          onPress={handlePlayPause}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          {/* Audio Wave Visualizer Bars */}
          <View style={styles.waveBarContainer}>
            {[18, 28, 14, 32, 22, 36, 16, 26, 34, 18, 30, 20, 36, 14, 28, 22, 34, 16].map((h, i) => {
              const active = (i / 18) * 100 <= progressPercent;
              return (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    { height: h, backgroundColor: active ? COLORS.primaryLight : '#334155' },
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
            <Text style={styles.timeText}>
              {durationMillis > 0 ? formatTime(durationMillis) : `${durationSec || 0}s`}
            </Text>
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
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
