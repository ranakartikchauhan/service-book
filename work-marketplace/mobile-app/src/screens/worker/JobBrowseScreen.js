import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Switch,
} from 'react-native';
import * as Location from 'expo-location';
import api from '../../api/client';

const STATUS_COLOR = { open: '#22c55e', assigned: '#f59e0b', in_progress: '#f59e0b' };
const RADIUS_OPTIONS = [1, 5, 10, 25];

export default function JobBrowseScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [isAvailableNow, setIsAvailableNow] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Please allow location access to see nearby jobs.');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return loc.coords;
    } catch {
      return null;
    }
  };

  const fetchJobs = useCallback(async (coords = location) => {
    if (!coords) return;
    try {
      const params = {
        lng: coords.longitude,
        lat: coords.latitude,
        radius: selectedRadius,
      };
      if (selectedCategory) params.category = selectedCategory;
      if (urgentOnly) params.isUrgent = 'true';

      const { data } = await api.get('/jobs/nearby', { params });
      setJobs(data.data.jobs || []);
    } catch (err) {
      console.error('Could not load nearby jobs:', err);
    }
  }, [location, selectedCategory, selectedRadius, urgentOnly]);

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
        await fetchJobs(coords);
      }
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
    if (location) fetchJobs();
  }, [selectedCategory, selectedRadius, urgentOnly]);

  const onRefresh = async () => {
    setRefreshing(true);
    const coords = await getLocation();
    if (coords) {
      setLocation(coords);
      await fetchJobs(coords);
    }
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

  const renderJob = ({ item }) => (
    <TouchableOpacity
      style={[styles.jobCard, item.isUrgent && styles.urgentJobCard]}
      onPress={() => navigation.navigate('WorkerJobDetail', { jobId: item._id })}
      activeOpacity={0.7}
    >
      {item.isUrgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentBadgeText}>🔥 URGENT / TODAY ONLY</Text>
        </View>
      )}

      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] || '#64748b' }]} />
      </View>

      <View style={styles.jobMeta}>
        <Text style={styles.metaText}>📍 {item.location?.addressText || 'Nearby'}</Text>
        <Text style={styles.metaText}>💰 ₹{item.budgetAmount} {item.budgetType}</Text>
      </View>

      <Text style={styles.jobDesc} numberOfLines={2}>{item.description}</Text>

      <View style={styles.jobFooter}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category?.name || 'Service'}</Text>
        </View>
        {item.posterRating?.count > 0 && (
          <Text style={styles.ratingText}>⭐ {item.posterRating.average}</Text>
        )}
        <Text style={styles.dateText}>{new Date(item.scheduledDate).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Finding nearby jobs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* "AVAILABLE NOW" LIVE STATUS BAR */}
      <View style={[styles.availabilityBar, isAvailableNow && styles.availabilityBarActive]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.liveDot, { backgroundColor: isAvailableNow ? '#22c55e' : '#64748b' }]} />
            <Text style={styles.availabilityTitle}>
              {isAvailableNow ? 'Active & Available for Work' : 'Currently Offline'}
            </Text>
          </View>
          <Text style={styles.availabilitySubtitle}>
            {isAvailableNow ? 'You will be notified for instant urgent jobs nearby' : 'Turn on to boost your ranking in nearby searches'}
          </Text>
        </View>
        <Switch
          value={isAvailableNow}
          onValueChange={handleToggleAvailability}
          disabled={togglingAvailability}
          trackColor={{ false: '#334155', true: '#22c55e' }}
          thumbColor="white"
        />
      </View>

      {/* FILTER CONTROLS BAR */}
      <View style={styles.controlsBar}>
        {/* Urgent filter toggle */}
        <TouchableOpacity
          style={[styles.urgentFilterBtn, urgentOnly && styles.urgentFilterBtnActive]}
          onPress={() => setUrgentOnly(!urgentOnly)}
        >
          <Text style={[styles.urgentFilterText, urgentOnly && styles.urgentFilterTextActive]}>
            🔥 Urgent Only
          </Text>
        </TouchableOpacity>

        {/* Distance Radius Chips */}
        <View style={styles.radiusGroup}>
          <Text style={styles.radiusLabel}>Radius:</Text>
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
          <Text style={styles.viewToggleText}>{viewMode === 'list' ? '🗺️ Map' : '📋 List'}</Text>
        </TouchableOpacity>
      </View>

      {/* CATEGORY FILTER CHIPS */}
      <FlatList
        horizontal
        data={[{ _id: null, name: 'All' }, ...categories]}
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

      {/* MAP VIEW SIMULATION OR LIST VIEW */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={{ fontSize: 44, marginBottom: 8 }}>🗺️</Text>
            <Text style={{ color: '#f8fafc', fontSize: 18, fontWeight: '700' }}>Hyperlocal Map View</Text>
            <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginHorizontal: 24, marginTop: 4 }}>
              Showing {jobs.length} jobs within {selectedRadius}km of your GPS location
            </Text>
            <View style={styles.mapPinsRow}>
              {jobs.slice(0, 4).map((j, i) => (
                <TouchableOpacity
                  key={j._id}
                  style={styles.mapPinCard}
                  onPress={() => navigation.navigate('WorkerJobDetail', { jobId: j._id })}
                >
                  <Text style={styles.mapPinTitle} numberOfLines={1}>📍 {j.title}</Text>
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
          contentContainerStyle={jobs.length === 0 ? styles.emptyContainer : { padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No jobs nearby</Text>
              <Text style={styles.emptySubtitle}>Try increasing your search radius or changing category filter</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', marginTop: 12 },

  availabilityBar: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityBarActive: { backgroundColor: '#0f291e', borderBottomColor: '#166534' },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  availabilityTitle: { fontSize: 13, fontWeight: '700', color: '#f8fafc' },
  availabilitySubtitle: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 8,
  },
  urgentFilterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  urgentFilterBtnActive: { backgroundColor: '#7f1d1d', borderColor: '#ef4444' },
  urgentFilterText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  urgentFilterTextActive: { color: '#fca5a5' },

  radiusGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  radiusLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  radiusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  radiusChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  radiusChipText: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  radiusChipTextActive: { color: 'white' },

  viewToggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  viewToggleText: { fontSize: 12, fontWeight: '700', color: '#cbd5e1' },

  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, maxHeight: 52 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  filterChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  filterText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: 'white' },

  jobCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  urgentJobCard: { borderColor: '#ef4444', borderWidth: 1.5, backgroundColor: '#221929' },
  urgentBadge: { alignSelf: 'flex-start', backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  urgentBadgeText: { color: 'white', fontSize: 10, fontWeight: '800' },

  jobHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  jobTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', flex: 1, marginRight: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  jobMeta: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  metaText: { fontSize: 12, color: '#94a3b8' },
  jobDesc: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 12 },
  jobFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryBadge: { backgroundColor: '#312e81', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { color: '#a5b4fc', fontSize: 11, fontWeight: '700' },
  ratingText: { fontSize: 12, color: '#94a3b8' },
  dateText: { fontSize: 12, color: '#64748b', marginLeft: 'auto' },

  mapContainer: { flex: 1, padding: 16 },
  mapPlaceholder: { flex: 1, backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center', padding: 20 },
  mapPinsRow: { marginTop: 24, width: '100%', gap: 10 },
  mapPinCard: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  mapPinTitle: { fontSize: 13, fontWeight: '700', color: '#f8fafc', flex: 1, marginRight: 8 },
  mapPinPrice: { fontSize: 13, fontWeight: '800', color: '#6366f1' },

  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' },
});
