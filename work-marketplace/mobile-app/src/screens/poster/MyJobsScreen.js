import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { COLORS, SHADOWS } from '../../theme';

const STATUS_BADGE = {
  open: { color: COLORS.success, label: 'OPEN' },
  assigned: { color: COLORS.warning, label: 'ASSIGNED' },
  in_progress: { color: COLORS.primaryLight, label: 'IN PROGRESS' },
  completed: { color: COLORS.accent, label: 'COMPLETED' },
  cancelled: { color: COLORS.textMuted, label: 'CANCELLED' },
};

export default function MyJobsScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyJobs = useCallback(async () => {
    try {
      const { data } = await api.get('/jobs/my-jobs');
      setJobs(data.data.jobs || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyJobs();
  }, [fetchMyJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyJobs();
  };

  const renderJob = ({ item }) => {
    const badge = STATUS_BADGE[item.status] || STATUS_BADGE.open;
    const isActiveSession = ['assigned', 'in_progress'].includes(item.status);

    return (
      <View style={[styles.card, SHADOWS.small]}>
        <View style={styles.cardHeader}>
          <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: `${badge.color}15`, borderColor: badge.color }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Ionicons name="cash-outline" size={13} color={COLORS.primaryLight} />
            <Text style={styles.jobMeta}>₹{item.budgetAmount} ({item.budgetType})</Text>
          </View>
          <View style={styles.metaCol}>
            <Ionicons name="pricetag-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.jobMeta}>{item.category?.name || 'General'}</Text>
          </View>
        </View>

        <Text style={styles.jobDesc} numberOfLines={2}>{item.description}</Text>

        <View style={styles.cardFooter}>
          {isActiveSession ? (
            <TouchableOpacity
              style={styles.activeSessionBtn}
              onPress={() => navigation.navigate('PosterActiveJob', { jobId: item._id })}
              activeOpacity={0.8}
            >
              <Ionicons name="flash-outline" size={14} color="#FFFFFF" />
              <Text style={styles.activeSessionTxt}>Open Active Job & Tracking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('PosterApplicants', { jobId: item._id, jobTitle: item.title })}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnText}>View Applicants</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primaryLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>
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
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(j) => j._id}
        renderItem={renderJob}
        contentContainerStyle={jobs.length === 0 ? styles.emptyContainer : { padding: 16, gap: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="reader-outline" size={36} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No jobs posted yet</Text>
            <Text style={styles.emptySubtitle}>Post your cleaning, repair, or household task in under 2 minutes.</Text>
            <TouchableOpacity
              style={[styles.postBtn, SHADOWS.glowPrimary]}
              onPress={() => navigation.navigate('PostJob')}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.postBtnText}>Post a Job Now</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  card: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  jobTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '800' },

  metaRow: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  metaCol: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobMeta: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },

  jobDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginBottom: 12 },
  cardFooter: { borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder, paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 8 },
  actionBtnText: { color: COLORS.primaryLight, fontSize: 13, fontWeight: '800' },

  activeSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeSessionTxt: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 90, paddingHorizontal: 24 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  postBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
