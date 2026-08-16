import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { COLORS, SHADOWS } from '../../theme';

export default function EarningsScreen() {
  const [earningsTotal, setEarningsTotal] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ upiId: '', bankAccountNumber: '', ifscCode: '' });
  const [savingPayout, setSavingPayout] = useState(false);
  const [showPayoutEdit, setShowPayoutEdit] = useState(false);

  const loadData = async () => {
    try {
      const [earningsRes, profileRes] = await Promise.all([
        api.get('/worker/earnings'),
        api.get('/worker/profile'),
      ]);
      setEarningsTotal(earningsRes.data.data.earningsTotal || 0);
      setTransactions(earningsRes.data.data.transactions || []);
      if (profileRes.data.data.profile?.payoutDetails) {
        setPayoutForm(profileRes.data.data.profile.payoutDetails);
      }
    } catch (err) {
      console.error('Error loading earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSavePayout = async () => {
    setSavingPayout(true);
    try {
      await api.put('/worker/payout-details', payoutForm);
      Alert.alert('✅ Saved', 'Your payout account details have been updated.');
      setShowPayoutEdit(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to save payout details.');
    } finally {
      setSavingPayout(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* HERO EARNINGS BALANCE CARD */}
        <View style={[styles.heroCard, SHADOWS.medium]}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroSub}>TOTAL ESCROW EARNINGS</Text>
            <View style={styles.verifiedTag}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.success} />
              <Text style={styles.verifiedTagTxt}>Razorpay Protected</Text>
            </View>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.balanceAmount}>{earningsTotal.toLocaleString()}</Text>
          </View>
          <Text style={styles.balanceNote}>Directly disbursed to your verified UPI / Bank Account</Text>
        </View>

        {/* PAYOUT SETTINGS CARD */}
        <View style={[styles.card, SHADOWS.small]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="card-outline" size={18} color={COLORS.primaryLight} />
              <Text style={styles.sectionTitle}>Payout Account</Text>
            </View>
            <TouchableOpacity onPress={() => setShowPayoutEdit(!showPayoutEdit)}>
              <Text style={styles.editLink}>{showPayoutEdit ? 'Close' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {showPayoutEdit ? (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>UPI ID (VPA)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. yourname@okhdfcbank"
                placeholderTextColor={COLORS.textMuted}
                value={payoutForm.upiId}
                onChangeText={(v) => setPayoutForm({ ...payoutForm, upiId: v })}
              />

              <Text style={styles.inputLabel}>Bank Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50100234567890"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={payoutForm.bankAccountNumber}
                onChangeText={(v) => setPayoutForm({ ...payoutForm, bankAccountNumber: v })}
              />

              <Text style={styles.inputLabel}>Bank IFSC Code</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. HDFC0001234"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
                value={payoutForm.ifscCode}
                onChangeText={(v) => setPayoutForm({ ...payoutForm, ifscCode: v })}
              />

              <TouchableOpacity
                style={[styles.saveBtn, savingPayout && styles.btnDisabled]}
                onPress={handleSavePayout}
                disabled={savingPayout}
              >
                {savingPayout ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Save Account</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.payoutDisplay}>
              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Primary UPI ID</Text>
                <Text style={styles.payoutValue}>{payoutForm.upiId || 'Not configured'}</Text>
              </View>
              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Bank Account</Text>
                <Text style={styles.payoutValue}>
                  {payoutForm.bankAccountNumber ? `•••• •••• ${payoutForm.bankAccountNumber.slice(-4)}` : 'Not configured'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* RECENT TRANSACTIONS */}
        <Text style={styles.transactionsHeader}>Recent Payout History</Text>
        {transactions.length === 0 ? (
          <View style={[styles.emptyCard, SHADOWS.small]}>
            <Ionicons name="receipt-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No transaction history</Text>
            <Text style={styles.emptySub}>Completed jobs will deposit payouts directly here.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {transactions.map((tx) => (
              <View key={tx._id} style={[styles.txCard, SHADOWS.small]}>
                <View style={styles.txIconCircle}>
                  <Ionicons name="arrow-down" size={18} color={COLORS.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txTitle}>{tx.jobId?.title || 'Service Job Completed'}</Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.releasedAt || tx.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.txAmount}>+₹{tx.workerPayout}</Text>
              </View>
            ))}
          </View>
        )}
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
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 16,
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroSub: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.6 },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  verifiedTagTxt: { fontSize: 10, color: COLORS.success, fontWeight: '800' },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 6 },
  currencySymbol: { fontSize: 26, fontWeight: '800', color: COLORS.primaryLight, marginRight: 4 },
  balanceAmount: { fontSize: 36, fontWeight: '900', color: COLORS.textPrimary },
  balanceNote: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  card: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: COLORS.surfaceBorder, marginBottom: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  editLink: { fontSize: 13, color: COLORS.primaryLight, fontWeight: '700' },

  payoutDisplay: { marginTop: 12, gap: 10 },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  payoutLabel: { fontSize: 13, color: COLORS.textMuted },
  payoutValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  inputLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, marginTop: 10, marginBottom: 4, textTransform: 'uppercase' },
  input: { backgroundColor: COLORS.surfaceLight, borderRadius: 10, padding: 12, color: COLORS.textPrimary, fontSize: 14, borderWidth: 1, borderColor: COLORS.surfaceBorderLight },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },

  transactionsHeader: { fontSize: 14, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginTop: 12 },
  emptySub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },

  txCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  txIconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(16, 185, 129, 0.12)', alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  txDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '900', color: COLORS.success },
});
