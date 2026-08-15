import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl
} from 'react-native';
import api from '../../api/client';

const STATUS_BADGE = {
  open: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', label: 'OPEN' },
  assigned: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', label: 'ASSIGNED' },
  in_progress: { bg: 'rgba(99,102,241,0.15)', text: '#818cf8', label: 'IN PROGRESS' },
  completed: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', label: 'COMPLETED' },
  cancelled: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', label: 'CANCELLED' },
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
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <Text style={styles.jobMeta}>💰 ₹{item.budgetAmount} · {item.category?.name || 'General'}</Text>
        <Text style={styles.jobDesc} numberOfLines={2}>{item.description}</Text>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('PosterApplicants', { jobId: item._id, jobTitle: item.title })}
          >
            <Text style={styles.actionBtnText}>View Applicants →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(j) => j._id}
        renderItem={renderJob}
        contentContainerStyle={jobs.length === 0 ? styles.emptyContainer : { padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No jobs posted yet</Text>
            <Text style={styles.emptySubtitle}>Tap the '+' tab below to post your first job</Text>
            <TouchableOpacity style={styles.postBtn} onPress={() => navigation.navigate('PostJob')}>
              <Text style={styles.postBtnText}>Post a Job Now</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  jobTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  jobMeta: { fontSize: 13, color: '#a5b4fc', fontWeight: '600', marginBottom: 8 },
  jobDesc: { fontSize: 14, color: '#94a3b8', lineHeight: 20, marginBottom: 14 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  actionBtnText: { color: '#6366f1', fontSize: 14, fontWeight: '700' },
  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' },
  postBtn: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  postBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
});
