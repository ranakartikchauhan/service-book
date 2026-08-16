import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme';

const STORAGE_KEY = 'has_seen_training_onboarding_v1';

export default function TrainingOnboardingModal({ navigation }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const seen = await AsyncStorage.getItem(STORAGE_KEY);
        if (!seen) {
          setVisible(true);
        }
      } catch (err) {
        console.warn('Error checking training onboarding status:', err);
      }
    };
    checkStatus();
  }, []);

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {}
    setVisible(false);
  };

  const handleWatch = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {}
    setVisible(false);
    if (navigation) {
      navigation.navigate('TrainingVideos');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, SHADOWS.medium]}>
          {/* BADGE */}
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
            <Text style={styles.badgeText}>Welcome to WorkMarket Academy</Text>
          </View>

          {/* ICON & TITLE */}
          <View style={styles.iconCircle}>
            <Ionicons name="school" size={32} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>Worker Orientation & Training</Text>
          <Text style={styles.hindiTitle}>प्रशिक्षण वीडियो और नियम</Text>

          <Text style={styles.description}>
            Watch quick 3-minute video lessons to understand how to receive direct Escrow payments, maintain safety, and earn 5-Star ratings.
          </Text>

          {/* BENEFIT BULLETS */}
          <View style={styles.bulletList}>
            <View style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.bulletText}>How to apply and set proposal rates</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.bulletText}>Listen to poster voice notes & inspect photos</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.bulletText}>Instant direct UPI / Bank Escrow payouts</Text>
            </View>
          </View>

          {/* ACTION BUTTONS */}
          <TouchableOpacity style={styles.watchBtn} onPress={handleWatch} activeOpacity={0.8}>
            <Ionicons name="play-circle" size={20} color="#FFFFFF" />
            <Text style={styles.watchBtnText}>Watch Training Videos (वीडियो देखें)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>Skip for Now (बाद में देखें)</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            You can re-watch these videos anytime from the Training menu in your profile.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  hindiTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryLight,
    marginTop: 2,
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  bulletList: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletText: {
    fontSize: 12,
    color: '#f8fafc',
    fontWeight: '600',
  },
  watchBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  watchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
});
