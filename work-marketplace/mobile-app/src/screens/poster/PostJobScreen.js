import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api/client';
import { getDeviceLocation, getAddressFromCoords, getCoordsFromAddress } from '../../utils/location';
import { COLORS, SHADOWS } from '../../theme';
import VoiceNoteRecorder from '../../components/VoiceNoteRecorder';

const CATEGORY_ICON_MAP = {
  Cleaning: 'broom',
  Cooking: 'chef-hat',
  'Kitchen Deep Clean': 'sparkles',
  Gardening: 'leaf',
  Laundry: 'washing-machine',
  'General Help': 'hand-heart',
};

export default function PostJobScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [fetchingCats, setFetchingCats] = useState(true);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [coords, setCoords] = useState(null); // { longitude, latitude }
  const [photos, setPhotos] = useState([]); // local photo URIs
  const [voiceNote, setVoiceNote] = useState(null); // { uri, durationSec }

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    budgetAmount: '',
    budgetType: 'fixed',
    addressText: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    isUrgent: false,
  });

  const handlePickPhotos = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos to attach work area images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map((a) => a.uri);
        setPhotos((prev) => [...prev, ...newUris].slice(0, 5));
      }
    } catch (err) {
      console.warn('Error picking photos:', err);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to take photos of your work area.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 5));
      }
    } catch (err) {
      console.warn('Error taking photo:', err);
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const detectLocation = async (showAlert = true) => {
    setDetectingLocation(true);
    try {
      const locationCoords = await getDeviceLocation({ showAlert });
      if (locationCoords) {
        setCoords({
          longitude: locationCoords.longitude,
          latitude: locationCoords.latitude,
        });

        const address = await getAddressFromCoords(locationCoords.latitude, locationCoords.longitude);
        if (address) {
          setForm((f) => ({ ...f, addressText: address }));
        }
      }
    } catch (err) {
      console.warn('Error in detectLocation:', err);
    } finally {
      setDetectingLocation(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Auto-detect home location on initial screen load
      detectLocation(false);

      try {
        const { data } = await api.get('/jobs/categories');
        const list = data.data.categories || [];
        setCategories(list);
        if (list.length > 0) {
          setForm((f) => ({ ...f, category: list[0]._id }));
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setFetchingCats(false);
      }
    };
    init();
  }, []);

  const handlePost = async () => {
    if (!form.title || !form.description || !form.budgetAmount || !form.category) {
      return Alert.alert('Missing Fields', 'Please fill in title, description, category, and budget.');
    }
    if (!form.addressText.trim()) {
      return Alert.alert('Missing Location', 'Please provide an address or tap "Share Home Location".');
    }

    setLoading(true);
    try {
      let finalCoords = coords;

      // If user typed/modified address text, resolve coordinates with OSM fallback
      if (form.addressText.trim()) {
        const addressCoords = await getCoordsFromAddress(form.addressText.trim());
        if (addressCoords) {
          finalCoords = addressCoords;
        }
      }

      // If still null, try one last device location probe
      if (!finalCoords) {
        finalCoords = await getDeviceLocation({ showAlert: false });
      }

      // Safe default fallback only if device completely refuses GPS
      if (!finalCoords) {
        finalCoords = { longitude: 77.2090, latitude: 28.6139 };
      }

      // Upload Work Photos (if any selected)
      let uploadedPhotoUrls = [];
      if (photos.length > 0) {
        for (const photoUri of photos) {
          try {
            const formData = new FormData();
            const filename = photoUri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';
            formData.append('photo', { uri: photoUri, name: filename, type });

            const uploadRes = await api.post('/jobs/upload-photo', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (uploadRes.data?.data?.photoUrl) {
              uploadedPhotoUrls.push(uploadRes.data.data.photoUrl);
            }
          } catch (uploadErr) {
            console.warn('Photo upload warning:', uploadErr?.message);
          }
        }
      }

      // Upload Voice Note (if recorded)
      let uploadedVoiceNote = undefined;
      if (voiceNote?.uri) {
        try {
          const formData = new FormData();
          const filename = voiceNote.uri.split('/').pop() || 'voice.m4a';
          formData.append('voice', { uri: voiceNote.uri, name: filename, type: 'audio/m4a' });
          formData.append('durationSec', String(voiceNote.durationSec || 0));

          const voiceRes = await api.post('/jobs/upload-voice', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (voiceRes.data?.data?.voiceNoteUrl) {
            uploadedVoiceNote = {
              url: voiceRes.data.data.voiceNoteUrl,
              durationSec: voiceNote.durationSec || 0,
            };
          }
        } catch (voiceErr) {
          console.warn('Voice upload warning:', voiceErr?.message);
        }
      }

      const payload = {
        ...form,
        longitude: finalCoords.longitude,
        latitude: finalCoords.latitude,
        budgetAmount: parseFloat(form.budgetAmount),
        scheduledDate: new Date(form.scheduledDate),
        photos: uploadedPhotoUrls,
        voiceNote: uploadedVoiceNote,
      };

      await api.post('/jobs', payload);
      Alert.alert('Success 🎉', 'Your service request is posted! Nearby workers can now view and listen to instructions.', [
        { text: 'View My Jobs', onPress: () => navigation.navigate('MyJobs') }
      ]);
      setForm({
        title: '',
        description: '',
        category: categories[0]?._id || '',
        budgetAmount: '',
        budgetType: 'fixed',
        addressText: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        isUrgent: false,
      });
      setPhotos([]);
      setVoiceNote(null);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create a Service Request</Text>
          <Text style={styles.headerSub}>Post what you need and get connected with verified local workers</Text>
        </View>

        <View style={[styles.card, SHADOWS.medium]}>
          {/* CATEGORY SELECTOR */}
          <Text style={styles.label}>Select Service Category *</Text>
          {fetchingCats ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {categories.map((cat) => {
                const isSelected = form.category === cat._id;
                const icon = CATEGORY_ICON_MAP[cat.name] || 'briefcase-outline';

                return (
                  <TouchableOpacity
                    key={cat._id}
                    style={[styles.catCard, isSelected && styles.catCardActive]}
                    onPress={() => setForm({ ...form, category: cat._id })}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={icon}
                      size={24}
                      color={isSelected ? '#FFFFFF' : COLORS.textMuted}
                    />
                    <Text style={[styles.catName, isSelected && styles.catNameActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* TITLE */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="create-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.label}>Job Title *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. 3BHK Deep Cleaning & Kitchen Mopping"
              placeholderTextColor={COLORS.textMuted}
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
            />
          </View>

          {/* DESCRIPTION */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="document-text-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.label}>Detailed Instructions *</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe tasks, required tools, specific areas, and any special instructions..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
            />
          </View>

          {/* VOICE INSTRUCTIONS FOR WORKERS */}
          <VoiceNoteRecorder
            onAudioRecorded={(audio) => setVoiceNote(audio)}
            initialAudio={voiceNote}
            onRemoveAudio={() => setVoiceNote(null)}
          />

          {/* WORK AREA PHOTOS (ROOM, SOFA, KITCHEN, ETC.) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="images-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.label}>Work Area Photos (Room, Sofa, Kitchen, etc.)</Text>
            </View>
            <Text style={styles.fieldHelper}>
              Attach up to 5 photos so workers can see the exact condition, room size, or items before applying.
            </Text>

            <View style={styles.photoActionRow}>
              <TouchableOpacity style={styles.photoPickBtn} onPress={handleTakePhoto} activeOpacity={0.8}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
                <Text style={styles.photoPickBtnTxt}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.photoPickBtnSecondary} onPress={handlePickPhotos} activeOpacity={0.8}>
                <Ionicons name="image" size={16} color={COLORS.primaryLight} />
                <Text style={styles.photoPickBtnSecondaryTxt}>From Gallery</Text>
              </TouchableOpacity>
            </View>

            {/* THUMBNAIL PREVIEWS */}
            {photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoPreviewScroll}>
                {photos.map((uri, idx) => (
                  <View key={idx} style={styles.photoPreviewThumbWrap}>
                    <Image source={{ uri }} style={styles.photoPreviewThumb} />
                    <TouchableOpacity style={styles.photoDeleteBadge} onPress={() => handleRemovePhoto(idx)}>
                      <Ionicons name="close" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* HOME LOCATION SHARING */}
          <View style={styles.inputGroup}>
            <View style={styles.locationHeaderRow}>
              <View style={styles.labelRow}>
                <Ionicons name="home-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.label}>Home / Job Location *</Text>
              </View>

              <TouchableOpacity
                style={styles.detectLocationBtn}
                onPress={() => detectLocation(true)}
                disabled={detectingLocation}
                activeOpacity={0.7}
              >
                {detectingLocation ? (
                  <ActivityIndicator size="small" color={COLORS.primaryLight} />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="locate" size={13} color={COLORS.primaryLight} />
                    <Text style={styles.detectLocationTxt}>Share Home Location</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="e.g. Flat 402, Tower 5, Sector 62, Noida"
              placeholderTextColor={COLORS.textMuted}
              value={form.addressText}
              onChangeText={(v) => setForm({ ...form, addressText: v })}
            />

            {coords ? (
              <View style={styles.gpsPill}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                <Text style={styles.gpsPillTxt}>
                  GPS Location Locked ({coords.latitude.toFixed(4)}°, {coords.longitude.toFixed(4)}°) — Workers nearby will see this immediately
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.tapGpsPrompt}
                onPress={() => detectLocation(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="navigate-circle-outline" size={16} color={COLORS.warning} />
                <Text style={styles.tapGpsPromptTxt}>
                  Tap to auto-detect your exact home address via GPS
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* BUDGET & RATE TYPE */}
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={styles.labelRow}>
                <Ionicons name="cash-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.label}>Budget (₹) *</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. 850"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={form.budgetAmount}
                onChangeText={(v) => setForm({ ...form, budgetAmount: v })}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={styles.labelRow}>
                <Ionicons name="options-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.label}>Rate Type</Text>
              </View>
              <View style={styles.rateTypeToggle}>
                <TouchableOpacity
                  style={[styles.rateBtn, form.budgetType === 'fixed' && styles.rateBtnActive]}
                  onPress={() => setForm({ ...form, budgetType: 'fixed' })}
                >
                  <Text style={[styles.rateBtnText, form.budgetType === 'fixed' && styles.rateBtnTextActive]}>Fixed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rateBtn, form.budgetType === 'hourly' && styles.rateBtnActive]}
                  onPress={() => setForm({ ...form, budgetType: 'hourly' })}
                >
                  <Text style={[styles.rateBtnText, form.budgetType === 'hourly' && styles.rateBtnTextActive]}>Hourly</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* URGENT TOGGLE BOX */}
          <TouchableOpacity
            style={[styles.urgentToggleBox, form.isUrgent && styles.urgentToggleBoxActive]}
            onPress={() => setForm({ ...form, isUrgent: !form.isUrgent })}
            activeOpacity={0.8}
          >
            <View style={styles.urgentIconCircle}>
              <Ionicons name="flame" size={20} color={form.isUrgent ? '#FFFFFF' : COLORS.textMuted} />
            </View>
            <View style={{ flex: 1, marginHorizontal: 10 }}>
              <Text style={[styles.urgentToggleTitle, form.isUrgent && styles.urgentToggleTitleActive]}>
                Mark as Urgent / Need Today
              </Text>
              <Text style={styles.urgentToggleDesc}>
                Highlighted in red and instantly broadcast to active workers nearby
              </Text>
            </View>
            <Ionicons
              name={form.isUrgent ? 'checkbox' : 'square-outline'}
              size={22}
              color={form.isUrgent ? COLORS.danger : COLORS.textMuted}
            />
          </TouchableOpacity>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.btnDisabled, SHADOWS.glowPrimary]}
            onPress={handlePost}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="rocket-outline" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Publish Job</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 18, paddingBottom: 40 },
  header: { marginBottom: 18, marginTop: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detectLocationBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  detectLocationTxt: { fontSize: 11, fontWeight: '800', color: COLORS.primaryLight },

  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  gpsPillTxt: { fontSize: 11, color: COLORS.success, fontWeight: '700', flex: 1, lineHeight: 15 },

  tapGpsPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  tapGpsPromptTxt: { fontSize: 11, color: COLORS.warning, fontWeight: '700', flex: 1 },

  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputGroup: { marginTop: 14 },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
  },
  textArea: { height: 95, textAlignVertical: 'top' },

  catScroll: { marginVertical: 10, marginHorizontal: -4 },
  catCard: {
    width: 100,
    height: 80,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    padding: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
  },
  catCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  catName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  catNameActive: {
    color: '#FFFFFF',
  },

  row: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 14 },
  rateTypeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
    height: 48,
    alignItems: 'center',
  },
  rateBtn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  rateBtnActive: { backgroundColor: COLORS.primary },
  rateBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  rateBtnTextActive: { color: '#FFFFFF' },

  urgentToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
  },
  urgentToggleBoxActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: COLORS.danger,
  },
  urgentIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentToggleTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  urgentToggleTitleActive: { color: '#FCA5A5' },
  urgentToggleDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, lineHeight: 15 },

  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  btnDisabled: { opacity: 0.6 },

  fieldHelper: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: 8,
  },
  photoActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  photoPickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
  },
  photoPickBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  photoPickBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  photoPickBtnSecondaryTxt: {
    color: COLORS.primaryLight,
    fontWeight: '800',
    fontSize: 12,
  },
  photoPreviewScroll: {
    marginTop: 10,
  },
  photoPreviewThumbWrap: {
    position: 'relative',
    marginRight: 10,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
  },
  photoPreviewThumb: {
    width: 76,
    height: 76,
    borderRadius: 10,
  },
  photoDeleteBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
