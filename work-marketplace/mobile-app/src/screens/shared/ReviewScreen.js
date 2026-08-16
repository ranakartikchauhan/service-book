import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { COLORS, SHADOWS } from '../../theme';

export default function ReviewScreen({ navigation, route }) {
  const { jobId, toUserId, targetName = 'User' } = route.params || {};
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!jobId || !toUserId) {
      return Alert.alert('Error', 'Missing job or target details.');
    }
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        jobId,
        toUserId,
        rating,
        comment,
      });
      Alert.alert('⭐ Thank You!', 'Your rating & review have been submitted.', [
        { text: 'Done', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.starIconCircle}>
            <Ionicons name="star" size={36} color="#FBBF24" />
          </View>
          <Text style={styles.title}>Rate Your Experience</Text>
          <Text style={styles.subtitle}>How was your service with {targetName}?</Text>
        </View>

        <View style={[styles.card, SHADOWS.medium]}>
          {/* STAR SELECTOR */}
          <Text style={styles.ratingLabel}>Tap to Rate (1 to 5 Stars)</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={38}
                  color={star <= rating ? '#FBBF24' : COLORS.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.ratingDescriptor}>
            {rating === 5 ? '⭐⭐⭐⭐⭐ Exceptional Service!' :
             rating === 4 ? '⭐⭐⭐⭐ Great Experience' :
             rating === 3 ? '⭐⭐⭐ Average' :
             rating === 2 ? '⭐⭐ Below Expectations' : '⭐ Poor Experience'}
          </Text>

          {/* COMMENT BOX */}
          <Text style={styles.inputLabel}>Written Review (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Share feedback on punctuality, quality of work, cleanliness, and communication..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.btnDisabled, SHADOWS.glowPrimary]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Submit Review</Text>
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
  header: { alignItems: 'center', marginBottom: 24 },
  starIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },

  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  ratingLabel: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.5 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 18 },
  starBtn: { padding: 4 },
  ratingDescriptor: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 20 },

  inputLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  textArea: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
  },

  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
});
