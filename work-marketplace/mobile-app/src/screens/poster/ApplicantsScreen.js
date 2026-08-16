import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { COLORS, SHADOWS } from '../../theme';

export default function ApplicantsScreen({ navigation, route }) {
  const { jobId, jobTitle } = route.params || {};
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(null);

  const fetchApplicants = async () => {
    try {
      const { data } = await api.get(`/jobs/${jobId}/applications`);
      setApplicants(data.data.applications || []);
    } catch (err) {
      console.error('Error fetching applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApplicants();
    setRefreshing(false);
  };

  const handleAccept = async (app) => {
    Alert.alert(
      'Hire Worker',
      `Accept ${app.workerId.name}'s proposal for ₹${app.proposedRate}? This will lock the escrow payment securely.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Hire',
          onPress: async () => {
            setAccepting(app._id);
            try {
              await api.post(`/jobs/${jobId}/applications/${app._id}/accept`, {
                paymentId: `pay_mock_${Date.now()}`,
              });
              Alert.alert('🎉 Worker Hired!', `${app.workerId.name} has been assigned to this job.`, [
                { text: 'Open Active Job', onPress: () => navigation.navigate('PosterActiveJob', { jobId }) }
              ]);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to hire worker.');
            } finally {
              setAccepting(null);
            }
          },
        },
      ]
    );
  };

  const renderApplicant = ({ item }) => {
    const worker = item.workerId;
    const profile = item.workerProfile;
    const isVerified = profile?.verification?.status === 'verified';

    return (
      <View style={[styles.card, SHADOWS.small]}>
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            {worker.profilePhotoUrl ? (
              <Image source={{ uri: worker.profilePhotoUrl }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarTxt}>{worker.name?.[0] || 'W'}</Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{worker.name}</Text>
            <View style={styles.badgeRow}>
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={11} color={COLORS.success} />
                  <Text style={styles.verifiedText}>ID Verified</Text>
                </View>
              )}
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={11} color="#FBBF24" />
                <Text style={styles.ratingText}>{profile?.rating?.average || '5.0'}</Text>
              </View>
              <Text style={styles.completedText}>{profile?.completedJobs || 0} jobs</Text>
            </View>
          </View>

          <View style={styles.ratePill}>
            <Text style={styles.ratePillCurrency}>₹</Text>
            <Text style={styles.ratePillAmount}>{item.proposedRate}</Text>
          </View>
        </View>

        {item.message ? (
          <View style={styles.msgBox}>
            <Text style={styles.msgText}>"{item.message}"</Text>
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate('Chat', { jobId, recipientId: worker._id, name: worker.name })}
          >
            <Ionicons name="chatbubbles-outline" size={15} color={COLORS.primaryLight} />
            <Text style={styles.chatBtnTxt}>Chat</Text>
          </TouchableOpacity>

          {item.status === 'pending' ? (
            <TouchableOpacity
              style={[styles.hireBtn, accepting === item._id && styles.btnDisabled]}
              onPress={() => handleAccept(item)}
              disabled={accepting === item._id}
            >
              {accepting === item._id ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.hireBtnTxt}>Accept & Hire</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.acceptedTag}>
              <Text style={styles.acceptedTxt}>{item.status.toUpperCase()}</Text>
            </View>
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerBox}>
          <Text style={styles.headerSub}>APPLICANTS FOR</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{jobTitle || 'Job'}</Text>
        </View>

        <FlatList
          data={applicants}
          keyExtractor={(a) => a._id}
          renderItem={renderApplicant}
          contentContainerStyle={applicants.length === 0 ? styles.emptyContainer : { padding: 16, gap: 14 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people-outline" size={36} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No applicants yet</Text>
              <Text style={styles.emptySubtitle}>Nearby verified workers will submit proposals shortly.</Text>
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

  headerBox: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  headerSub: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.5 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: COLORS.textPrimary, marginTop: 2 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarTxt: { fontSize: 20, fontWeight: '900', color: COLORS.primaryLight },
  name: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  verifiedText: { fontSize: 10, color: COLORS.success, fontWeight: '700' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 11, color: COLORS.textPrimary, fontWeight: '700' },
  completedText: { fontSize: 11, color: COLORS.textMuted },

  ratePill: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratePillCurrency: { fontSize: 11, fontWeight: '700', color: COLORS.primaryLight, marginRight: 2 },
  ratePillAmount: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary },

  msgBox: {
    backgroundColor: COLORS.surfaceLight,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  msgText: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder, paddingTop: 10 },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.surfaceLight },
  chatBtnTxt: { color: COLORS.primaryLight, fontWeight: '800', fontSize: 12 },
  hireBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  hireBtnTxt: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  btnDisabled: { opacity: 0.6 },
  acceptedTag: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  acceptedTxt: { fontSize: 11, color: COLORS.success, fontWeight: '800' },

  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 24 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
});
