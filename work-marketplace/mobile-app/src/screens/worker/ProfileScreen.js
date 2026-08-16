import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../theme';

export default function ProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission Required', 'Please allow gallery access to select a profile photo.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setUploadingPhoto(true);

      try {
        const formData = new FormData();
        formData.append('photo', {
          uri: asset.uri,
          name: `avatar_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });

        await api.post('/auth/profile-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        Alert.alert('Success', 'Profile photo updated successfully.');
        if (refreshUser) await refreshUser();
        await loadProfile();
      } catch (err) {
        Alert.alert('Upload Failed', err.response?.data?.message || 'Could not upload profile photo.');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

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
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handlePickProfilePhoto}
            disabled={uploadingPhoto}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              {uploadingPhoto ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : user?.profilePhotoUrl ? (
                <Image source={{ uri: user.profilePhotoUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarTxt}>{user?.name?.[0] || 'W'}</Text>
              )}
            </View>
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
          <Text style={styles.tapToChangeTxt}>Tap avatar to update photo</Text>

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
            onPress={() => navigation.navigate('TrainingVideos')}
          >
            <Ionicons name="school-outline" size={20} color={COLORS.primaryLight} />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.actionTitle}>Training & Academy (प्रशिक्षण)</Text>
              <Text style={styles.actionSub}>Learn safety, customer service & earn 5 stars</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('ContactSupport')}
          >
            <Ionicons name="headset-outline" size={20} color={COLORS.info} />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.actionTitle}>Customer Support & Help</Text>
              <Text style={styles.actionSub}>24/7 WhatsApp, Helpline, and Ticket support</Text>
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
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.surfaceLight,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarTxt: { fontSize: 34, fontWeight: '900', color: '#FFFFFF' },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  name: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  phone: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  tapToChangeTxt: { fontSize: 11, color: COLORS.primaryLight, marginTop: 4, fontWeight: '600' },

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
