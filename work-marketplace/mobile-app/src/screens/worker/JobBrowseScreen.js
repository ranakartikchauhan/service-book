import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Switch, TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import api from '../../api/client';
import { getDeviceLocation } from '../../utils/location';
import { COLORS, SHADOWS } from '../../theme';

const STATUS_COLOR = { open: COLORS.success, assigned: COLORS.warning, in_progress: COLORS.primary };
const RADIUS_OPTIONS = [1, 5, 10, 25];

const CATEGORY_ICON_MAP = {
  Cleaning: 'broom',
  Cooking: 'chef-hat',
  'Kitchen Deep Clean': 'sparkles',
  Gardening: 'leaf',
  Laundry: 'washing-machine',
  'General Help': 'hand-heart',
};

export default function JobBrowseScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [isAvailableNow, setIsAvailableNow] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  const getLocation = async () => {
    return await getDeviceLocation({ showAlert: false });
  };

  const fetchJobs = useCallback(async (coords = location, queryText = searchQuery) => {
    try {
      const params = {};
      if (coords && coords.longitude && coords.latitude && !queryText.trim()) {
        params.lng = coords.longitude;
        params.lat = coords.latitude;
        params.radius = selectedRadius;
      }
      if (queryText && queryText.trim()) {
        params.search = queryText.trim();
      }
      if (selectedCategory) params.category = selectedCategory;
      if (urgentOnly) params.isUrgent = 'true';

      const { data } = await api.get('/jobs/nearby', { params });
      setJobs(data.data.jobs || []);
    } catch (err) {
      console.error('Could not load jobs:', err);
    }
  }, [location, selectedCategory, selectedRadius, urgentOnly, searchQuery]);

  const loadWorkerAvailability = async () => {
    try {
      const { data } = await api.get('/worker/profile');
      setIsAvailableNow(Boolean(data.data.profile?.isAvailableNow));
    } catch {}
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const coords = await getLocation();
      if (coords) {
        setLocation(coords);
      }
      await fetchJobs(coords);
      try {
        const { data } = await api.get('/jobs/categories');
        setCategories(data.data.categories || []);
      } catch {}
      await loadWorkerAvailability();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    fetchJobs(location);
  }, [selectedCategory, selectedRadius, urgentOnly]);

  const onRefresh = async () => {
    setRefreshing(true);
    const coords = await getLocation();
    if (coords) {
      setLocation(coords);
    }
    await fetchJobs(coords || location);
    await loadWorkerAvailability();
    setRefreshing(false);
  };

  const handleToggleAvailability = async (value) => {
    setIsAvailableNow(value);
    setTogglingAvailability(true);
    try {
      const coords = location || (await getLocation());
      await api.put('/worker/availability-toggle', {
        isAvailableNow: value,
        longitude: coords?.longitude,
        latitude: coords?.latitude,
      });
    } catch (err) {
      setIsAvailableNow(!value);
      Alert.alert('Error', 'Failed to update live availability status.');
    } finally {
      setTogglingAvailability(false);
    }
  };

  const renderJob = ({ item }) => {
    const iconName = CATEGORY_ICON_MAP[item.category?.name] || 'briefcase-outline';

    return (
      <TouchableOpacity
        style={[styles.jobCard, item.isUrgent && styles.urgentJobCard, SHADOWS.small]}
        onPress={() => navigation.navigate('WorkerJobDetail', { jobId: item._id })}
        activeOpacity={0.75}
      >
        {item.isUrgent && (
          <View style={styles.urgentBadge}>
            <Ionicons name="flame" size={13} color="#FFFFFF" />
            <Text style={styles.urgentBadgeText}>URGENT / TODAY ONLY</Text>
          </View>
        )}

        <View style={styles.jobHeader}>
          <View style={styles.categoryIconCircle}>
            <MaterialCommunityIcons name={iconName} size={20} color={COLORS.primaryLight} />
          </View>
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.location?.addressText || 'Near your location'}
              </Text>
            </View>
          </View>
          <View style={styles.budgetPill}>
            <Text style={styles.budgetPillCurrency}>₹</Text>
            <Text style={styles.budgetPillAmount}>{item.budgetAmount}</Text>
          </View>
        </View>

        <Text style={styles.jobDesc} numberOfLines={2}>{item.description}</Text>

        {/* MEDIA BADGES (VOICE NOTE & PHOTOS) */}
        {(item.voiceNote?.url || (item.photos && item.photos.length > 0)) && (
          <View style={styles.mediaBadgesRow}>
            {item.voiceNote?.url && (
              <View style={styles.voiceNotePill}>
                <Ionicons name="mic" size={12} color={COLORS.primaryLight} />
                <Text style={styles.voiceNotePillText}>
                  {item.voiceNote.durationSec > 0 ? `Voice Note (${item.voiceNote.durationSec}s)` : 'Voice Note'}
                </Text>
              </View>
            )}
            {item.photos && item.photos.length > 0 && (
              <View style={styles.photosPill}>
                <Ionicons name="images" size={12} color={COLORS.success} />
                <Text style={styles.photosPillText}>{item.photos.length} {item.photos.length === 1 ? 'Work Photo' : 'Work Photos'}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.jobFooter}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category?.name || 'Service'}</Text>
          </View>
          {item.posterRating?.count > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingText}>{item.posterRating.average}</Text>
            </View>
          )}
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.dateText}>{new Date(item.scheduledDate).toLocaleDateString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Finding nearby opportunities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* "AVAILABLE NOW" LIVE STATUS BAR */}
      <View style={[styles.availabilityBar, isAvailableNow && styles.availabilityBarActive]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.liveDot, { backgroundColor: isAvailableNow ? COLORS.success : COLORS.textMuted }]} />
            <Text style={styles.availabilityTitle}>
              {isAvailableNow ? 'Available for Work Now' : 'Currently Offline'}
            </Text>
          </View>
          <Text style={styles.availabilitySubtitle}>
            {isAvailableNow ? 'Active on map & notified for instant urgent jobs nearby' : 'Turn on to boost your ranking in nearby searches'}
          </Text>
        </View>
        <Switch
          value={isAvailableNow}
          onValueChange={handleToggleAvailability}
          disabled={togglingAvailability}
          trackColor={{ false: COLORS.surfaceBorderLight, true: COLORS.success }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* SEARCH BAR (Location & Keyword Search) */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city, sector, area or service..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              fetchJobs(location, text);
            }}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                fetchJobs(location, '');
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* FILTER CONTROLS BAR */}
      <View style={styles.controlsBar}>
        {/* Urgent filter toggle */}
        <TouchableOpacity
          style={[styles.urgentFilterBtn, urgentOnly && styles.urgentFilterBtnActive]}
          onPress={() => setUrgentOnly(!urgentOnly)}
        >
          <Ionicons name="flame" size={14} color={urgentOnly ? '#FCA5A5' : COLORS.textMuted} />
          <Text style={[styles.urgentFilterText, urgentOnly && styles.urgentFilterTextActive]}>
            Urgent Only
          </Text>
        </TouchableOpacity>

        {/* Distance Radius Chips */}
        <View style={styles.radiusGroup}>
          <Ionicons name="navigate-outline" size={13} color={COLORS.textMuted} />
          {RADIUS_OPTIONS.map((rad) => (
            <TouchableOpacity
              key={rad}
              style={[styles.radiusChip, selectedRadius === rad && styles.radiusChipActive]}
              onPress={() => setSelectedRadius(rad)}
            >
              <Text style={[styles.radiusChipText, selectedRadius === rad && styles.radiusChipTextActive]}>
                {rad}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* View mode toggle */}
        <TouchableOpacity
          style={styles.viewToggleBtn}
          onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        >
          <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={15} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* CATEGORY FILTER CHIPS */}
      <View style={{ maxHeight: 52 }}>
        <FlatList
          horizontal
          data={[{ _id: null, name: 'All Services' }, ...categories]}
          keyExtractor={(c) => c._id || 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === cat._id && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat._id)}
            >
              <Text style={[styles.filterText, selectedCategory === cat._id && styles.filterTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* MAP VIEW OR LIST VIEW */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <View style={styles.mapIconCircle}>
              <Ionicons name="map" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.mapTitle}>Hyperlocal Radar View</Text>
            <Text style={styles.mapSubtitle}>
              Showing {jobs.length} verified jobs within {selectedRadius}km of your GPS coordinates
            </Text>
            <View style={styles.mapPinsRow}>
              {jobs.slice(0, 4).map((j) => (
                <TouchableOpacity
                  key={j._id}
                  style={styles.mapPinCard}
                  onPress={() => navigation.navigate('WorkerJobDetail', { jobId: j._id })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mapPinTitle} numberOfLines={1}>{j.title}</Text>
                    <Text style={styles.mapPinSub}>{j.category?.name || 'Local Task'}</Text>
                  </View>
                  <Text style={styles.mapPinPrice}>₹{j.budgetAmount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => j._id}
          renderItem={renderJob}
          contentContainerStyle={jobs.length === 0 ? styles.emptyContainer : { padding: 16, gap: 14 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={36} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No jobs within {selectedRadius}km</Text>
              <Text style={styles.emptySubtitle}>No open service requests in your immediate radius right now.</Text>
              {selectedRadius < 25 && (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: COLORS.primary,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 10,
                    marginTop: 16,
                  }}
                  onPress={() => setSelectedRadius(25)}
                >
                  <Ionicons name="expand-outline" size={16} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                    Expand Search to 25km
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  loadingText: { color: COLORS.textSecondary, marginTop: 12, fontSize: 13, fontWeight: '600' },

  availabilityBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityBarActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderBottomColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveDot: { width: 9, height: 9, borderRadius: 4.5 },
  availabilityTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  availabilitySubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: COLORS.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    padding: 0,
  },

  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    gap: 8,
  },
  urgentFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
  },
  urgentFilterBtnActive: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: COLORS.danger },
  urgentFilterText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  urgentFilterTextActive: { color: '#FCA5A5' },

  radiusGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  radiusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.surfaceBorderLight },
  radiusChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  radiusChipText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700' },
  radiusChipTextActive: { color: '#FFFFFF' },

  viewToggleBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#FFFFFF' },

  jobCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  urgentJobCard: {
    borderColor: COLORS.danger,
    borderWidth: 1.5,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  urgentBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  jobHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 3 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: COLORS.textMuted },
  budgetPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  budgetPillCurrency: { fontSize: 11, fontWeight: '700', color: COLORS.primaryLight, marginRight: 2 },
  budgetPillAmount: { fontSize: 15, fontWeight: '900', color: COLORS.textPrimary },

  jobDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 8 },
  mediaBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  voiceNotePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  voiceNotePillText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '800',
  },
  photosPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  photosPillText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '800',
  },
  jobFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder, paddingTop: 10 },
  categoryBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: { color: COLORS.primaryLight, fontSize: 11, fontWeight: '700' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.surfaceLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ratingText: { fontSize: 11, color: COLORS.textPrimary, fontWeight: '700' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  dateText: { fontSize: 11, color: COLORS.textMuted },

  mapContainer: { flex: 1, padding: 16 },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mapIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(99, 102, 241, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  mapTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  mapSubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: 4, marginHorizontal: 16 },
  mapPinsRow: { marginTop: 20, width: '100%', gap: 10 },
  mapPinCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
  },
  mapPinTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  mapPinSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  mapPinPrice: { fontSize: 14, fontWeight: '900', color: COLORS.primaryLight },

  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 18 },
});
