import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import api from '../../api/client';

export default function PostJobScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCats, setFetchingCats] = useState(true);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    budgetAmount: '',
    budgetType: 'fixed',
    addressText: '',
    scheduledDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get('/admin/categories');
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
    loadCategories();
  }, []);

  const handlePost = async () => {
    if (!form.title || !form.description || !form.budgetAmount || !form.category) {
      return Alert.alert('Missing Fields', 'Please fill in title, description, category, and budget.');
    }

    setLoading(true);
    try {
      // Default coordinates (e.g. New Delhi / user location fallback)
      const payload = {
        ...form,
        longitude: 77.2090,
        latitude: 28.6139,
        budgetAmount: parseFloat(form.budgetAmount),
        scheduledDate: new Date(form.scheduledDate),
      };

      await api.post('/jobs', payload);
      Alert.alert('Success 🎉', 'Your job has been posted! Workers nearby can now view and apply.', [
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
      });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.headerTitle}>Post a New Job</Text>
        <Text style={styles.headerSub}>Hire trusted nearby help in minutes</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Job Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Kitchen Deep Cleaning"
            placeholderTextColor="#64748b"
            value={form.title}
            onChangeText={(v) => setForm({ ...form, title: v })}
          />

          <Text style={styles.label}>Select Category *</Text>
          {fetchingCats ? (
            <ActivityIndicator color="#6366f1" style={{ marginVertical: 10 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c._id}
                  style={[styles.catChip, form.category === c._id && styles.catChipActive]}
                  onPress={() => setForm({ ...form, category: c._id })}
                >
                  <Text style={[styles.catText, form.category === c._id && styles.catTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the tasks, tools required, or any specific instructions..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
          />

          <Text style={styles.label}>Location / Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sector 18, Noida"
            placeholderTextColor="#64748b"
            value={form.addressText}
            onChangeText={(v) => setForm({ ...form, addressText: v })}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Budget (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 750"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={form.budgetAmount}
                onChangeText={(v) => setForm({ ...form, budgetAmount: v })}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Rate Type</Text>
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

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.btnDisabled]}
            onPress={handlePost}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Publish Job</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginTop: 10 },
  headerSub: { fontSize: 14, color: '#94a3b8', marginTop: 4, marginBottom: 20 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155' },
  label: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#334155', borderRadius: 10, padding: 14, color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#475569' },
  textArea: { height: 100, textAlignVertical: 'top' },
  catRow: { flexDirection: 'row', marginVertical: 6 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#334155', marginRight: 8, borderWidth: 1, borderColor: '#475569' },
  catChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  catText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  catTextActive: { color: 'white' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rateTypeToggle: { flexDirection: 'row', backgroundColor: '#334155', borderRadius: 10, padding: 3, borderWidth: 1, borderColor: '#475569' },
  rateBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 8 },
  rateBtnActive: { backgroundColor: '#6366f1' },
  rateBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  rateBtnTextActive: { color: 'white' },
  submitBtn: { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
