import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import api from '../../api/client';

const STATUS_COLOR = { open: '#22c55e', assigned: '#f59e0b', in_progress: '#f59e0b' };

export default function JobBrowseScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location Required', 'Please allow location access to see nearby jobs.');
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return loc.coords;
  };

  const fetchJobs = useCallback(async (coords = location) => {
    if (!coords) return;
    try {
      const params = { lng: coords.longitude, lat: coords.latitude, radius: 10 };
      if (selectedCategory) params.category = selectedCategory;
      const { data } = await api.get('/jobs/nearby', { params });
      setJobs(data.data.jobs);
    } catch (err) {
      Alert.alert('Error', 'Could not load nearby jobs.');
    }
  }, [location, selectedCategory]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const coords = await getLocation();
      if (coords) {
        setLocation(coords);
        await fetchJobs(coords);
      }
      // Fetch categories for filter
      try {
        const { data } = await api.get('/jobs/categories');
        setCategories(data.data.categories || []);
      } catch {}
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (location) fetchJobs();
  }, [selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    const coords = await getLocation();
    if (coords) { setLocation(coords); await fetchJobs(coords); }
    setRefreshing(false);
  };

  const renderJob = ({ item }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => navigation.navigate('WorkerJobDetail', { jobId: item._id })}
      activeOpacity={0.7}
    >
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
          <Text style={styles.categoryText}>{item.category?.name}</Text>
        </View>
        {item.posterRating?.count > 0 && (
          <Text style={styles.ratingText}>⭐ {item.posterRating.average} poster</Text>
        )}
        <Text style={styles.dateText}>{new Date(item.scheduledDate).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Finding jobs near you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category filter */}
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
            <Text style={styles.emptySubtitle}>Pull down to refresh or try a different category</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', marginTop: 12 },

  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  filterChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  filterText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: 'white' },

  jobCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
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

  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' },
});
