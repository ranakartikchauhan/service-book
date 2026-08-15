import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView, Image,
} from 'react-native';
import * as Location from 'expo-location';
import api from '../../api/client';
import JobTimeline from '../../components/JobTimeline';
import { useTranslation } from '../../i18n';

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
    const interval = setInterval(fetchJobDetails, 15000); // refresh every 15s
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
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const worker = job.assignedWorkerId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* TOP STATUS BAR */}
        <View style={styles.headerBox}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobAddress}>📍 {job.location?.addressText || 'Job Location'}</Text>
          <Text style={styles.jobBudget}>₹{job.budgetAmount} · {job.budgetType} budget</Text>
        </View>

        {/* JOB STATUS TIMELINE COMPONENT */}
        <JobTimeline currentStatus={job.status} statusHistory={job.statusHistory} />

        {/* ASSIGNED WORKER CARD */}
        {worker && (
          <View style={styles.workerCard}>
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
              <Text style={styles.verifiedBadge}>✓ ID Verified Worker</Text>
            </View>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => navigation.navigate('Chat', { recipientId: worker._id, name: worker.name })}
            >
              <Text style={styles.chatBtnText}>💬 Chat</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LIVE WORKER TRACKING (If Active) */}
        {['assigned', 'in_progress'].includes(job.status) && (
          <View style={styles.liveTrackingCard}>
            <View style={styles.liveHeader}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveTitle}>{t('live_location_sharing')}</Text>
            </View>
            <Text style={styles.liveSub}>
              {liveLocation ? t('approaching_you') : 'Worker GPS will update as they travel towards you.'}
            </Text>
            {liveLocation && (
              <View style={styles.coordsBox}>
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
            style={[styles.completeBtn, completing && styles.btnDisabled]}
            onPress={handleMarkComplete}
            disabled={completing}
          >
            {completing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.completeBtnText}>✅ Confirm Completion & Release Payment</Text>
            )}
          </TouchableOpacity>
        )}

        {/* EMERGENCY SOS BUTTON */}
        {['assigned', 'in_progress'].includes(job.status) && (
          <TouchableOpacity
            style={[styles.sosBtn, triggeringSos && styles.btnDisabled]}
            onPress={handleTriggerSOS}
            disabled={triggeringSos}
            activeOpacity={0.8}
          >
            <Text style={styles.sosBtnText}>{t('sos_button')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  headerBox: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  jobTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc', marginBottom: 6 },
  jobAddress: { fontSize: 13, color: '#94a3b8', marginBottom: 4 },
  jobBudget: { fontSize: 14, fontWeight: '700', color: '#6366f1' },

  workerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 10,
  },
  workerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarTxt: { fontSize: 20, fontWeight: '800', color: 'white' },
  workerName: { fontSize: 15, fontWeight: '700', color: '#f8fafc' },
  workerPhone: { fontSize: 12, color: '#94a3b8' },
  verifiedBadge: { fontSize: 11, color: '#4ade80', fontWeight: '700', marginTop: 2 },
  chatBtn: { backgroundColor: '#312e81', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  chatBtnText: { color: '#a5b4fc', fontWeight: '700', fontSize: 13 },

  liveTrackingCard: {
    backgroundColor: '#0f291e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#166534',
    marginVertical: 10,
  },
  liveHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  liveTitle: { fontSize: 14, fontWeight: '700', color: '#86efac' },
  liveSub: { fontSize: 12, color: '#a7f3d0', lineHeight: 16 },
  coordsBox: { marginTop: 8, backgroundColor: 'rgba(0,0,0,0.2)', padding: 6, borderRadius: 6 },
  coordsTxt: { fontSize: 11, color: '#6ee7b7', fontFamily: 'monospace' },

  completeBtn: { backgroundColor: '#22c55e', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 14 },
  completeBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },

  sosBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#f87171',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sosBtnText: { color: 'white', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
});
