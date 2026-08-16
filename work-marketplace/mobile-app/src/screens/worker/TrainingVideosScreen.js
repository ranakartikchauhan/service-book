import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, Linking, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { COLORS, SHADOWS } from '../../theme';

const CATEGORIES = [
  { key: 'all', label: 'All Videos (सभी)' },
  { key: 'onboarding', label: 'Onboarding (शुरुआत)' },
  { key: 'customer_service', label: 'Client Rules (बातचीत)' },
  { key: 'payments', label: 'Payments (पैसे)' },
  { key: 'safety', label: 'Safety (सुरक्षा)' },
  { key: 'skills', label: 'Skills (हुनर)' },
];

export default function TrainingVideosScreen({ navigation }) {
  const [videos, setVideos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVideos = async (cat = selectedCategory) => {
    try {
      const { data } = await api.get(`/training/videos?category=${cat}`);
      if (data?.data?.videos) {
        setVideos(data.data.videos);
      }
    } catch (err) {
      console.warn('Error fetching training videos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVideos(selectedCategory);
  }, [selectedCategory]);

  const handlePlayVideo = (video) => {
    if (!video?.videoUrl) return;

    Linking.openURL(video.videoUrl).catch(() => {
      Alert.alert('Unable to Open Video', 'Could not open video player.');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchVideos(selectedCategory);
            }}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* HERO BANNER */}
        <View style={[styles.heroCard, SHADOWS.medium]}>
          <View style={styles.heroBadge}>
            <Ionicons name="school" size={14} color="#FFFFFF" />
            <Text style={styles.heroBadgeText}>WorkMarket Academy</Text>
          </View>
          <Text style={styles.heroTitle}>Worker Training Videos (प्रशिक्षण वीडियो)</Text>
          <Text style={styles.heroSubtitle}>
            Watch these simple 3-minute video lessons to learn app features, safety rules, and how to earn 5-star ratings.
          </Text>
        </View>

        {/* CATEGORY FILTER TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.tabChip, isSelected && styles.tabChipActive]}
                onPress={() => setSelectedCategory(cat.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* VIDEOS LIST */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading training modules...</Text>
          </View>
        ) : videos.length === 0 ? (
          <View style={[styles.emptyCard, SHADOWS.small]}>
            <Ionicons name="film-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No videos in this category</Text>
            <Text style={styles.emptySub}>Please check back soon or switch categories.</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {videos.map((video) => (
              <TouchableOpacity
                key={video._id}
                style={[styles.videoCard, SHADOWS.medium]}
                onPress={() => handlePlayVideo(video)}
                activeOpacity={0.9}
              >
                {/* VIDEO THUMBNAIL */}
                <View style={styles.thumbWrapper}>
                  <Image
                    source={{
                      uri: video.thumbnailUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
                    }}
                    style={styles.thumbnail}
                  />
                  <View style={styles.playOverlay}>
                    <View style={styles.playCircle}>
                      <Ionicons name="play" size={24} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={styles.durationBadge}>
                    <Ionicons name="time" size={10} color="#FFFFFF" />
                    <Text style={styles.durationText}>{video.durationMinutes} min</Text>
                  </View>
                </View>

                {/* VIDEO DETAILS */}
                <View style={styles.detailsBox}>
                  <View style={styles.langPill}>
                    <Text style={styles.langText}>{video.language || 'Hindi'}</Text>
                  </View>
                  <Text style={styles.videoTitle}>{video.title}</Text>
                  {video.description ? (
                    <Text style={styles.videoDesc} numberOfLines={2}>
                      {video.description}
                    </Text>
                  ) : null}

                  <View style={styles.watchRow}>
                    <Text style={styles.watchText}>Tap to Watch Video (वीडियो देखें)</Text>
                    <Ionicons name="arrow-forward-circle" size={16} color={COLORS.primaryLight} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, paddingBottom: 40 },

  heroCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 17,
  },

  tabScroll: {
    gap: 8,
    marginBottom: 16,
  },
  tabChip: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  videoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  thumbWrapper: {
    position: 'relative',
    width: '100%',
    height: 160,
    backgroundColor: '#0f172a',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  detailsBox: {
    padding: 14,
  },
  langPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  langText: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    lineHeight: 19,
  },
  videoDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 16,
  },
  watchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
  },
  watchText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },

  center: {
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
  },
  emptySub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
});
