import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, SafeAreaView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { COLORS, SHADOWS } from '../../theme';

const STATUS_CONFIG = {
  pending: { label: 'Under Review', color: COLORS.warning, icon: 'hourglass-outline' },
  accepted: { label: 'Accepted / Hired', color: COLORS.success, icon: 'checkmark-circle' },
  rejected: { label: 'Declined', color: COLORS.danger, icon: 'close-circle-outline' },
  withdrawn: { label: 'Withdrawn', color: COLORS.textMuted, icon: 'remove-circle-outline' },
};

export default function MyApplicationsScreen({ navigation }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchApplications = async () => {
    try {
      const { data } = await api.get('/jobs/applications/mine');
      setApplications(data.data.applications || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteJob = (job) => {
    Alert.alert(
      'Mark as Completed?',
      `Are you sure you have finished all work for "${job.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            try {
              await api.patch(`/jobs/${job._id}/complete`);
              Alert.alert('🎉 Job Completed!', 'Great job! The client has been notified.');
              fetchApplications();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to complete job.');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  };

  const filteredApps = filterStatus === 'all'
    ? applications
    : applications.filter((a) => a.status === filterStatus);

  const renderApplication = ({ item }) => {
    const job = item.jobId;
    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

    if (!job) return null;

    return (
      <TouchableOpacity
        style={[styles.appCard, SHADOWS.small]}
        onPress={() => navigation.navigate('WorkerJobDetail', { jobId: job._id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{job.category?.name || 'Service'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusCfg.color}15`, borderColor: statusCfg.color }]}>
            <Ionicons name={statusCfg.icon} size={13} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
        <Text style={styles.jobAddress} numberOfLines={1}>
          📍 {job.location?.addressText || 'Near your location'}
        </Text>

        <View style={styles.divider} />

        <View style={styles.proposalRow}>
          <View>
            <Text style={styles.proposalLabel}>YOUR PROPOSED RATE</Text>
            <Text style={styles.rateValue}>₹{item.proposedRate}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.proposalLabel}>APPLIED ON</Text>
            <Text style={styles.dateValue}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {item.message ? (
          <View style={styles.noteBox}>
            <Ionicons name="chatbox-ellipses-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.noteText} numberOfLines={1}>"{item.message}"</Text>
          </View>
        ) : null}

        {item.status === 'accepted' && (
          <View style={{ marginTop: 12, gap: 8 }}>
            <TouchableOpacity
              style={styles.chatActionBtn}
              onPress={() => navigation.navigate('Chat', { jobId: job._id, name: job.title })}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
              <Text style={styles.chatActionBtnText}>Chat with Client</Text>
            </TouchableOpacity>

            {job.status !== 'completed' ? (
              <TouchableOpacity
                style={styles.completeActionBtn}
                onPress={() => handleCompleteJob(job)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-done-circle" size={16} color="#FFFFFF" />
                <Text style={styles.completeActionBtnText}>Mark Job Completed</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.completedBanner}>
                <Ionicons name="checkmark-circle" size={15} color={COLORS.success} />
                <Text style={styles.completedBannerText}>Job Successfully Completed</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* FILTER TABS */}
        <View style={styles.tabFilterRow}>
          {['all', 'pending', 'accepted', 'rejected'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.tabFilterBtn, filterStatus === st && styles.tabFilterBtnActive]}
              onPress={() => setFilterStatus(st)}
            >
              <Text style={[styles.tabFilterTxt, filterStatus === st && styles.tabFilterTxtActive]}>
                {st.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIST */}
        <FlatList
          data={filteredApps}
          keyExtractor={(a) => a._id}
          renderItem={renderApplication}
          contentContainerStyle={filteredApps.length === 0 ? styles.emptyContainer : { padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="clipboard-outline" size={36} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No applications found</Text>
              <Text style={styles.emptySubtitle}>Browse available jobs and submit proposals to start earning.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },

  tabFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    gap: 8,
  },
  tabFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  tabFilterBtnActive: { backgroundColor: COLORS.primary },
  tabFilterTxt: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted },
  tabFilterTxtActive: { color: '#FFFFFF' },

  appCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: { color: COLORS.primaryLight, fontSize: 11, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '800' },

  jobTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  jobAddress: { fontSize: 12, color: COLORS.textMuted },
  divider: { height: 1, backgroundColor: COLORS.surfaceBorder, marginVertical: 12 },

  proposalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proposalLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.5 },
  rateValue: { fontSize: 18, fontWeight: '900', color: COLORS.primaryLight, marginTop: 2 },
  dateValue: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: COLORS.surfaceLight,
    padding: 8,
    borderRadius: 8,
  },
  noteText: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', flex: 1 },

  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  chatActionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  completeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.success,
    paddingVertical: 12,
    borderRadius: 12,
  },
  completeActionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  completedBannerText: { color: COLORS.success, fontSize: 12, fontWeight: '800' },

  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 24 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 18 },
});
