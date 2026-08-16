import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { COLORS, SHADOWS } from '../../theme';
import VoiceNotePlayer from '../../components/VoiceNotePlayer';
import WorkPhotosGallery from '../../components/WorkPhotosGallery';

export default function JobDetailScreen({ navigation, route }) {
  const { jobId } = route.params || {};
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [proposedRate, setProposedRate] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data } = await api.get(`/jobs/${jobId}`);
        setJob(data.data.job);
        setProposedRate(data.data.job.budgetAmount?.toString() || '');
      } catch (err) {
        Alert.alert('Error', 'Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleApply = async () => {
    if (!proposedRate) {
      return Alert.alert('Missing Rate', 'Please enter your proposed rate.');
    }
    setApplying(true);
    try {
      await api.post(`/jobs/${jobId}/apply`, {
        proposedRate: parseFloat(proposedRate),
        message,
      });
      Alert.alert('🎉 Proposal Sent!', 'Your application has been submitted to the poster.', [
        { text: 'View Applications', onPress: () => navigation.navigate('MyApplications') }
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit proposal.';
      if (msg.includes('limit reached')) {
        Alert.alert(
          'Application Limit Reached',
          msg,
          [
            { text: 'Upgrade to Pro', onPress: () => navigation.navigate('Subscription') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else if (msg.includes('verification')) {
        Alert.alert(
          'ID Verification Required',
          msg,
          [
            { text: 'Verify ID Now', onPress: () => navigation.navigate('WorkerVerification') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Application Failed', msg);
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading || !job) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HERO JOB HEADER */}
        <View style={[styles.card, SHADOWS.medium]}>
          {job.isUrgent && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flame" size={13} color="#FFFFFF" />
              <Text style={styles.urgentBadgeText}>URGENT / TODAY ONLY</Text>
            </View>
          )}

          <Text style={styles.jobTitle}>{job.title}</Text>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{job.category?.name || 'Local Service'}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>BUDGET</Text>
              <Text style={styles.budgetValue}>₹{job.budgetAmount} <Text style={{ fontSize: 12, color: COLORS.textMuted }}>({job.budgetType})</Text></Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>SCHEDULED DATE</Text>
              <Text style={styles.dateValue}>{new Date(job.scheduledDate).toLocaleDateString()}</Text>
            </View>
          </View>

          <View style={styles.addressBox}>
            <Ionicons name="location" size={16} color={COLORS.primaryLight} />
            <Text style={styles.addressText}>{job.location?.addressText || 'Nearby location'}</Text>
          </View>
        </View>

        {/* VOICE INSTRUCTIONS PLAYER */}
        {job.voiceNote?.url && (
          <VoiceNotePlayer
            url={job.voiceNote.url}
            durationSec={job.voiceNote.durationSec}
            title="Listen to Client Voice Instructions"
          />
        )}

        {/* WORK AREA PHOTOS GALLERY */}
        {job.photos && job.photos.length > 0 && (
          <WorkPhotosGallery photos={job.photos} />
        )}

        {/* DESCRIPTION */}
        <View style={[styles.card, SHADOWS.small]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={16} color={COLORS.primaryLight} />
            <Text style={styles.sectionTitle}>Job Description & Requirements</Text>
          </View>
          <Text style={styles.descriptionText}>{job.description}</Text>
        </View>

        {/* POSTER PROFILE CARD */}
        {job.posterId && (
          <View style={[styles.card, SHADOWS.small]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={16} color={COLORS.primaryLight} />
              <Text style={styles.sectionTitle}>Job Poster</Text>
            </View>
            <View style={styles.posterRow}>
              <View style={styles.posterAvatar}>
                <Text style={styles.posterAvatarTxt}>{job.posterId.name?.[0] || 'P'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.posterName}>{job.posterId.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="shield-checkmark" size={13} color={COLORS.success} />
                  <Text style={styles.posterVerified}>Verified Household</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* PROPOSAL FORM */}
        <View style={[styles.card, SHADOWS.medium]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="send-outline" size={16} color={COLORS.primaryLight} />
            <Text style={styles.sectionTitle}>Submit Your Proposal</Text>
          </View>

          <Text style={styles.inputLabel}>Your Proposed Rate (₹) *</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.rateInput}
              placeholder="Enter amount"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              value={proposedRate}
              onChangeText={setProposedRate}
            />
          </View>

          <Text style={styles.inputLabel}>Cover Message (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell the poster about your experience, arrival time, or equipment..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity
            style={[styles.applyBtn, applying && styles.btnDisabled, SHADOWS.glowPrimary]}
            onPress={handleApply}
            disabled={applying}
            activeOpacity={0.8}
          >
            {applying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                <Text style={styles.applyBtnText}>Send Proposal</Text>
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
  container: { padding: 18, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 14,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  urgentBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

  jobTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 8 },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  categoryPillText: { color: COLORS.primaryLight, fontSize: 12, fontWeight: '700' },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.surfaceBorder },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.5 },
  budgetValue: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary, marginTop: 2 },
  dateValue: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginTop: 4 },

  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  addressText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  descriptionText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 21 },

  posterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  posterAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  posterAvatarTxt: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  posterName: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  posterVerified: { fontSize: 12, color: COLORS.success, fontWeight: '600' },

  inputLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, marginTop: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
  },
  currencyPrefix: { fontSize: 18, fontWeight: '800', color: COLORS.primaryLight, marginRight: 6 },
  rateInput: { flex: 1, paddingVertical: 12, color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  applyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  applyBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  btnDisabled: { opacity: 0.6 },
});
