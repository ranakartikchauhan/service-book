import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, useAudioPlayer, AudioModule, RecordingPresets } from 'expo-audio';
import { COLORS, SHADOWS } from '../theme';

/**
 * VoiceNoteRecorder — Full voice instruction recording component using expo-audio.
 * Allows posters to record, preview, and delete voice instructions for workers.
 */
export default function VoiceNoteRecorder({ onAudioRecorded, initialAudio = null, onRemoveAudio }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState(initialAudio?.uri || null);
  const [durationSec, setDurationSec] = useState(initialAudio?.durationSec || 0);
  const [recordingTime, setRecordingTime] = useState(0);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const timerRef = useRef(null);

  // Sync initialAudio if passed
  useEffect(() => {
    if (initialAudio?.uri) {
      setRecordingUri(initialAudio.uri);
      setDurationSec(initialAudio.durationSec || 0);
    }
  }, [initialAudio]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Microphone Permission Required',
          'WorkMarket requires microphone access so you can record voice instructions for workers.',
          [{ text: 'OK' }]
        );
        return;
      }

      await AudioModule.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecording: true,
      });

      audioRecorder.record();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      Alert.alert('Recording Error', 'Unable to start audio recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);

      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      const finalDuration = recordingTime > 0 ? recordingTime : 1;

      setRecordingUri(uri);
      setDurationSec(finalDuration);

      if (onAudioRecorded) {
        onAudioRecorded({ uri, durationSec: finalDuration });
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
      Alert.alert('Recording Error', 'Failed to save audio recording.');
    }
  };

  const handleRemove = () => {
    setRecordingUri(null);
    setDurationSec(0);
    setRecordingTime(0);
    if (onRemoveAudio) onRemoveAudio();
  };

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={[styles.container, SHADOWS.small]}>
      {/* HEADER */}
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

      {/* STATE 1: RECORDING IN PROGRESS */}
      {isRecording && (
        <View style={styles.recordingState}>
          <View style={styles.recordingIndicator}>
            <View style={styles.redPulse} />
            <Text style={styles.recordingTimer}>Recording: {formatTime(recordingTime)}</Text>
          </View>
          <TouchableOpacity style={styles.stopBtn} onPress={stopRecording} activeOpacity={0.8}>
            <Ionicons name="stop-circle" size={24} color="#FFFFFF" />
            <Text style={styles.stopBtnText}>Stop Recording</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STATE 2: RECORDED AUDIO AVAILABLE */}
      {!isRecording && recordingUri && (
        <View style={styles.recordedState}>
          <View style={styles.audioPreviewCard}>
            <View style={styles.previewIconBg}>
              <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewTitle}>Voice Note Ready ({formatTime(durationSec)})</Text>
              <Text style={styles.previewSub}>Audio will be attached to your job post.</Text>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleRemove}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STATE 3: READY TO RECORD */}
      {!isRecording && !recordingUri && (
        <TouchableOpacity style={styles.recordBtn} onPress={startRecording} activeOpacity={0.8}>
          <Ionicons name="mic" size={20} color="#FFFFFF" />
          <Text style={styles.recordBtnText}>Tap to Record Voice Note</Text>
        </TouchableOpacity>
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
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  recordBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  recordingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 12,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  recordingTimer: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 13,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  stopBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  recordedState: {
    marginTop: 4,
  },
  audioPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 13,
  },
  previewSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
});
