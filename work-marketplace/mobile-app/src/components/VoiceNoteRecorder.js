import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme';

export default function VoiceNoteRecorder({ onAudioRecorded, initialAudio = null, onRemoveAudio }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedUri, setRecordedUri] = useState(initialAudio?.uri || null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant microphone access to record voice instructions.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Recording Error', 'Unable to start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      setRecordedUri(uri);
      setRecording(null);

      if (onAudioRecorded) {
        onAudioRecorded({
          uri,
          durationSec: recordingDuration,
        });
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const handlePlayPreview = async () => {
    if (!recordedUri) return;

    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordedUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (err) {
      console.error('Playback preview error:', err);
    }
  };

  const handleDelete = () => {
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setRecordedUri(null);
    setRecordingDuration(0);
    setIsPlaying(false);
    if (onRemoveAudio) onRemoveAudio();
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
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

      {/* RECORDING / PLAYER STATE */}
      {!recordedUri ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.8}
          >
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={24} color="#FFFFFF" />
            <Text style={styles.recordBtnText}>
              {isRecording ? 'Stop Recording' : 'Record Voice Note'}
            </Text>
          </TouchableOpacity>

          {isRecording && (
            <View style={styles.recordingTimerBox}>
              <View style={styles.pulseDot} />
              <Text style={styles.timerText}>{formatSeconds(recordingDuration)}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.previewBox}>
          <View style={styles.previewLeft}>
            <TouchableOpacity style={styles.playBtn} onPress={handlePlayPreview}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <View>
              <Text style={styles.previewTitle}>Voice Note Ready</Text>
              <Text style={styles.previewDuration}>
                {recordingDuration > 0 ? `${formatSeconds(recordingDuration)} duration` : 'Recorded Audio'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  recordBtnActive: {
    backgroundColor: '#ef4444',
  },
  recordBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  recordingTimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  timerText: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 13,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  previewDuration: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  deleteText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
});
