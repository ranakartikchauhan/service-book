import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme';

export default function WorkPhotosGallery({ photos = [] }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!photos || photos.length === 0) return null;

  return (
    <View style={[styles.container, SHADOWS.small]}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="images-outline" size={17} color={COLORS.primaryLight} />
          <Text style={styles.title}>Work Area Photos</Text>
        </View>
        <Text style={styles.countBadge}>{photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
        {photos.map((uri, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.photoWrapper}
            onPress={() => setSelectedPhoto(uri)}
            activeOpacity={0.85}
          >
            <Image source={{ uri }} style={styles.photoThumb} />
            <View style={styles.zoomIconCircle}>
              <Ionicons name="scan-outline" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FULLSCREEN IMAGE PREVIEW MODAL */}
      <Modal visible={Boolean(selectedPhoto)} transparent animationType="fade">
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPhoto(null)}>
            <Ionicons name="close-circle" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image source={{ uri: selectedPhoto }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  countBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryLight,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scrollList: {
    gap: 10,
  },
  photoWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  photoThumb: {
    width: 110,
    height: 90,
    borderRadius: 12,
  },
  zoomIconCircle: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});
