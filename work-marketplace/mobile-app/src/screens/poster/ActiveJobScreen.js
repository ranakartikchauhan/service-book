import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import JobTimeline from '../../components/JobTimeline';
import { useTranslation } from '../../i18n';
import { COLORS, SHADOWS } from '../../theme';

export default function ActiveJobScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { jobId } = route.params || {};
  const [job, setJob] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [triggeringSos, setTriggeringSos] = useState(false);

  const fetchJobDetails = async () => {
    try {
      const [jobRes, locRes] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get(`/safety/live-location/${jobId}`).catch(() => ({ data: { data: {} } })),
      ]);
      setJob(jobRes.data.data.job);
      setLiveLocation(locRes.data.data.liveLocation || null);
    } catch (err) {
      console.error('Error fetching active job:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
    const interval = setInterval(fetchJobDetails, 15000);
    return () => clearInterval(interval);
  }, [jobId]);

  const handleTriggerSOS = () => {
    Alert.alert(
      t('sos_confirm_title'),
      t('sos_confirm_body'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'CONFIRM SOS',
          style: 'destructive',
          onPress: async () => {
            setTriggeringSos(true);
            try {
              let coords = { longitude: 77.209, latitude: 28.6139 };
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                coords = loc.coords;
              }
              const { data } = await api.post('/safety/sos', {
                jobId: job._id,
                longitude: coords.longitude,
                latitude: coords.latitude,
              });
              Alert.alert('🚨 SOS Dispatched', data.message || 'Safety team notified.');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to trigger SOS.');
            } finally {
              setTriggeringSos(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkComplete = async () => {
    Alert.alert(
      'Confirm Job Completion',
      `Are you sure the work is finished to your satisfaction? This will release the escrow payment of ₹${job.budgetAmount} to the worker.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release Payment',
          onPress: async () => {
            setCompleting(true);
            try {
              await api.patch(`/jobs/${job._id}/complete`);
              Alert.alert('🎉 Job Completed', 'Payment has been released to the worker.');
              fetchJobDetails();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to complete job.');
            } finally {
              setCompleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !job) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const worker = job.assignedWorkerId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* TOP STATUS BAR */}
        <View style={[styles.headerBox, SHADOWS.small]}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.jobAddress}>{job.location?.addressText || 'Job Location'}</Text>
          </View>
          <View style={styles.budgetRow}>
            <Ionicons name="cash-outline" size={15} color={COLORS.primaryLight} />
            <Text style={styles.jobBudget}>₹{job.budgetAmount} · {job.budgetType} budget</Text>
          </View>
        </View>

        {/* JOB STATUS TIMELINE COMPONENT */}
        <JobTimeline currentStatus={job.status} statusHistory={job.statusHistory} />

        {/* ASSIGNED WORKER CARD */}
        {worker && (
          <View style={[styles.workerCard, SHADOWS.small]}>
            <View style={styles.workerAvatar}>
              {worker.profilePhotoUrl ? (
                <Image source={{ uri: worker.profilePhotoUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarTxt}>{worker.name?.[0] || 'W'}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.workerName}>{worker.name}</Text>
              <Text style={styles.workerPhone}>{worker.phone}</Text>
              <View style={styles.badgeRow}>
                <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                <Text style={styles.verifiedBadge}>ID Verified Worker</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => navigation.navigate('Chat', { jobId, recipientId: worker._id, name: worker.name })}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles-outline" size={16} color="#FFFFFF" />
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LIVE WORKER TRACKING (If Active) */}
        {['assigned', 'in_progress'].includes(job.status) && (
          <View style={[styles.liveTrackingCard, SHADOWS.small]}>
            <View style={styles.liveHeader}>
              <View style={styles.pulseDot} />
              <Ionicons name="navigate-circle-outline" size={18} color="#86EFAC" />
              <Text style={styles.liveTitle}>{t('live_location_sharing')}</Text>
            </View>
            <Text style={styles.liveSub}>
              {liveLocation ? t('approaching_you') : 'Worker GPS will update as they travel towards you.'}
            </Text>
            {liveLocation && (
              <View style={styles.coordsBox}>
                <Ionicons name="compass-outline" size={14} color="#6EE7B7" />
                <Text style={styles.coordsTxt}>
                  GPS: {liveLocation.coordinates?.[1]?.toFixed(4)}° N, {liveLocation.coordinates?.[0]?.toFixed(4)}° E
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ACTIONS */}
        {job.status === 'in_progress' && (
          <TouchableOpacity
            style={[styles.completeBtn, completing && styles.btnDisabled, SHADOWS.glowPrimary]}
            onPress={handleMarkComplete}
            disabled={completing}
            activeOpacity={0.8}
          >
            {completing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="checkmark-done-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.completeBtnText}>Confirm Completion & Release Payment</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* EMERGENCY SOS BUTTON */}
        {['assigned', 'in_progress'].includes(job.status) && (
          <TouchableOpacity
            style={[styles.sosBtn, triggeringSos && styles.btnDisabled, SHADOWS.medium]}
            onPress={handleTriggerSOS}
            disabled={triggeringSos}
            activeOpacity={0.8}
          >
            <Ionicons name="warning-outline" size={22} color="#FFFFFF" />
            <Text style={styles.sosBtnText}>{t('sos_button')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 18, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },

  headerBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 8,
  },
  jobTitle: { fontSize: 19, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 6 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  jobAddress: { fontSize: 13, color: COLORS.textMuted },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  jobBudget: { fontSize: 14, fontWeight: '800', color: COLORS.primaryLight },

  workerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 10,
  },
  workerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarTxt: { fontSize: 20, fontWeight: '900', color: COLORS.primaryLight },
  workerName: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  workerPhone: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  verifiedBadge: { fontSize: 11, color: COLORS.success, fontWeight: '700' },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  chatBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },

  liveTrackingCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginVertical: 10,
  },
  liveHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  liveTitle: { fontSize: 14, fontWeight: '800', color: '#86EFAC' },
  liveSub: { fontSize: 12, color: '#A7F3D0', lineHeight: 16 },
  coordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  coordsTxt: { fontSize: 11, color: '#6EE7B7', fontFamily: 'monospace' },

  completeBtn: {
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  completeBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },

  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  sosBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
});
