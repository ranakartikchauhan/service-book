import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { COLORS, SHADOWS } from '../../theme';

const ID_OPTIONS = [
  { key: 'aadhaar', label: 'Aadhaar Card', icon: 'card-outline' },
  { key: 'pan', label: 'PAN Card', icon: 'card-outline' },
  { key: 'voter_id', label: 'Voter ID Card', icon: 'id-card-outline' },
  { key: 'driving_license', label: 'Driving License', icon: 'car-outline' },
  { key: 'passport', label: 'Passport', icon: 'airplane-outline' },
];

export default function VerificationScreen({ navigation }) {
  const [idType, setIdType] = useState('aadhaar');
  const [selectedImage, setSelectedImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert('Permission Required', 'Please allow gallery access to upload your government ID.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      return Alert.alert('Missing Document', 'Please upload or capture a photo of your ID card.');
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('idType', idType);
      formData.append('idDoc', {
        uri: selectedImage.uri,
        name: `id_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      await api.post('/worker/verification/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert(
        '✅ Submitted for Review',
        'Your government ID document has been submitted securely. Our verification team will review it within 24-48 hours.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Submission Error', err.response?.data?.message || 'Failed to submit document.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.badgeCircle}>
            <Ionicons name="shield-checkmark" size={36} color={COLORS.success} />
          </View>
          <Text style={styles.title}>Government ID Verification</Text>
          <Text style={styles.subtitle}>
            Verified workers receive 4x more job hires and a trusted green badge next to their profile.
          </Text>
        </View>

        <View style={[styles.card, SHADOWS.medium]}>
          <Text style={styles.sectionLabel}>1. Select Document Type</Text>
          <View style={styles.optionsList}>
            {ID_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.optRow, idType === opt.key && styles.optRowActive]}
                onPress={() => setIdType(opt.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={idType === opt.key ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={idType === opt.key ? COLORS.primaryLight : COLORS.textMuted}
                />
                <Text style={[styles.optTxt, idType === opt.key && styles.optTxtActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>2. Upload Photo of ID Document</Text>
          <TouchableOpacity
            style={[styles.uploadBox, selectedImage && styles.uploadBoxSelected]}
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            {selectedImage ? (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={40} color={COLORS.success} />
                <Text style={styles.uploadSuccessTxt}>ID Photo Selected</Text>
                <Text style={styles.uploadSubTxt}>Tap to change photo</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="cloud-upload-outline" size={40} color={COLORS.primaryLight} />
                <Text style={styles.uploadTitle}>Tap to select from gallery</Text>
                <Text style={styles.uploadSubTxt}>Supports JPG, PNG (Clear & readable photo)</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.privacyBox}>
            <Ionicons name="lock-closed" size={14} color={COLORS.success} />
            <Text style={styles.privacyTxt}>
              Your document is encrypted at rest and accessible only to verified safety compliance officers.
            </Text>
          </View>

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
                <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Submit ID for Verification</Text>
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
  header: { alignItems: 'center', marginBottom: 20 },
  badgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18, paddingHorizontal: 12 },

  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  optionsList: { gap: 8 },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
  },
  optRowActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(99, 102, 241, 0.1)' },
  optTxt: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  optTxtActive: { color: COLORS.textPrimary, fontWeight: '800' },

  uploadBox: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.surfaceBorderLight,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  uploadBoxSelected: { borderColor: COLORS.success, borderStyle: 'solid', backgroundColor: 'rgba(16, 185, 129, 0.08)' },
  uploadTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginTop: 8 },
  uploadSuccessTxt: { fontSize: 14, fontWeight: '800', color: COLORS.success, marginTop: 8 },
  uploadSubTxt: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },

  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  privacyTxt: { fontSize: 11, color: '#A7F3D0', flex: 1, lineHeight: 15 },

  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
});
