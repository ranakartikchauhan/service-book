import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../theme';

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/worker/profile');
        setProfile(data.data.profile);
      } catch (err) {
        console.error('Error loading worker profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isVerified = profile?.verification?.status === 'verified';
  const isPending = profile?.verification?.status === 'pending';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HERO PROFILE CARD */}
        <View style={[styles.heroCard, SHADOWS.medium]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{user?.name?.[0] || 'W'}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>

          <View style={[
            styles.verifyBadge,
            isVerified ? styles.badgeVerified : isPending ? styles.badgePending : styles.badgeUnverified
          ]}>
            <Ionicons
              name={isVerified ? 'checkmark-circle' : isPending ? 'time' : 'alert-circle'}
              size={14}
              color={isVerified ? COLORS.success : isPending ? COLORS.warning : COLORS.danger}
            />
            <Text style={[
              styles.verifyTxt,
              { color: isVerified ? COLORS.success : isPending ? COLORS.warning : COLORS.danger }
            ]}>
              {isVerified ? 'ID VERIFIED WORKER' : isPending ? 'VERIFICATION PENDING' : 'UNVERIFIED ID'}
            </Text>
          </View>
        </View>

        {/* PERFORMANCE STATS */}
        <View style={[styles.statsRow, SHADOWS.small]}>
          <View style={styles.statCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={16} color="#FBBF24" />
              <Text style={styles.statValue}>{profile?.rating?.average || '5.0'}</Text>
            </View>
            <Text style={styles.statLabel}>{profile?.rating?.count || 0} Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{profile?.completedJobs || 0}</Text>
            <Text style={styles.statLabel}>Completed Jobs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>₹{profile?.earningsTotal || 0}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
        </View>

        {/* SKILLS & BIO */}
        <View style={[styles.card, SHADOWS.small]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="construct-outline" size={16} color={COLORS.primaryLight} />
            <Text style={styles.cardHeaderTitle}>Skills & Specialization</Text>
          </View>
          <View style={styles.skillsRow}>
            {(profile?.skills?.length > 0 ? profile.skills : ['Cleaning', 'Cooking', 'Home Repair']).map((sk) => (
              <View key={sk} style={styles.skillChip}>
                <Text style={styles.skillTxt}>{sk}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.cardHeaderRow, { marginTop: 16 }]}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.primaryLight} />
            <Text style={styles.cardHeaderTitle}>About Me / Bio</Text>
          </View>
          <Text style={styles.bioTxt}>
            {profile?.bio || 'Experienced and reliable service provider dedicated to quality and customer satisfaction.'}
          </Text>
        </View>

        {/* QUICK SHORTCUTS */}
        <View style={[styles.card, SHADOWS.small]}>
          <Text style={styles.cardHeaderTitle}>Quick Access</Text>

          {!isVerified && (
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('WorkerVerification')}
            >
              <Ionicons name="ribbon-outline" size={20} color={COLORS.warning} />
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.actionTitle}>Complete ID Verification</Text>
                <Text style={styles.actionSub}>Unlock applying to all verified jobs</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Ionicons name="card-outline" size={20} color={COLORS.accent} />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.actionTitle}>Worker Pro Membership</Text>
              <Text style={styles.actionSub}>Boost profile ranking & get unlimited applications</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={20} color={COLORS.primaryLight} />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.actionTitle}>Account Settings</Text>
              <Text style={styles.actionSub}>Notifications, language, and emergency contacts</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
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

  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 16,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: COLORS.surfaceLight,
  },
  avatarTxt: { fontSize: 32, fontWeight: '900', color: '#FFFFFF' },
  name: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  phone: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  verifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 12,
    borderWidth: 1,
  },
  badgeVerified: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' },
  badgePending: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' },
  badgeUnverified: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  verifyTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 16,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '900', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  statDivider: { width: 1, backgroundColor: COLORS.surfaceBorder, height: '80%', alignSelf: 'center' },

  card: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: COLORS.surfaceBorder, marginBottom: 16 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardHeaderTitle: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },

  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.surfaceBorderLight },
  skillTxt: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' },
  bioTxt: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    marginTop: 6,
  },
  actionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  actionSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
