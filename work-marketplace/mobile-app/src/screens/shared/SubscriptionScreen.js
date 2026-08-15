import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function SubscriptionScreen({ navigation }) {
  const { user } = useAuth();
  const role = user?.currentMode || 'worker';
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);

  const loadData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get('/subscriptions/plans', { params: { role } }),
        api.get('/subscriptions/my-subscription', { params: { role } }),
      ]);
      setPlans(plansRes.data.data.plans || []);
      setCurrentSub(subRes.data.data.subscription || null);
    } catch (err) {
      console.error('Error loading subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const handleSubscribe = async (plan) => {
    if (plan.isFree) return Alert.alert('Active Plan', 'You are already on the Free tier.');
    setUpgrading(plan._id);
    try {
      // In production, integrate Razorpay Checkout SDK here
      const { data } = await api.post('/subscriptions/subscribe', {
        planId: plan._id,
        paymentId: `pay_mock_${Date.now()}`,
      });
      Alert.alert('🎉 Subscribed!', data.message || `You are now upgraded to ${plan.name}`);
      await loadData();
    } catch (err) {
      Alert.alert('Subscription Failed', err.response?.data?.message || 'Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel auto-renewal? You will keep your benefits until the end of your billing cycle.',
      [
        { text: 'Keep My Plan', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/subscriptions/cancel', { role });
              Alert.alert('Subscription Cancelled', 'Auto-renewal has been turned off.');
              loadData();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const activePlanId = currentSub?.planId?._id || currentSub?.planId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.tagline}>
            {role === 'worker' ? 'WORKER PRO SUBSCRIPTION' : 'POSTER BUSINESS SUBSCRIPTION'}
          </Text>
          <h1 style={styles.title}>
            {role === 'worker' ? 'Earn More & Get Hired Faster' : 'Hire Top Workers on Priority'}
          </h1>
          <Text style={styles.subtitle}>
            {role === 'worker'
              ? 'Unlock unlimited applications, top search ranking, and lower platform commission fees.'
              : 'Unlock unlimited job postings, automated recurring scheduling, and priority matching.'}
          </Text>
        </View>

        {/* CURRENT USAGE SUMMARY */}
        {currentSub && (
          <View style={styles.usageCard}>
            <Text style={styles.usageTitle}>Current Billing Cycle Usage</Text>
            <View style={styles.usageRow}>
              <Text style={styles.usageLabel}>
                {role === 'worker' ? 'Applications Used This Month:' : 'Jobs Posted This Month:'}
              </Text>
              <Text style={styles.usageValue}>
                {role === 'worker'
                  ? `${currentSub.usageThisCycle?.applicationsUsed || 0} / ${
                      currentSub.planId?.limits?.maxApplicationsPerMonth === -1
                        ? 'Unlimited'
                        : currentSub.planId?.limits?.maxApplicationsPerMonth || 10
                    }`
                  : `${currentSub.usageThisCycle?.jobsPostedUsed || 0} / ${
                      currentSub.planId?.limits?.maxJobPostingsPerMonth === -1
                        ? 'Unlimited'
                        : currentSub.planId?.limits?.maxJobPostingsPerMonth || 3
                    }`}
              </Text>
            </View>
          </View>
        )}

        {/* PLANS LIST */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => {
            const isCurrent = activePlanId === plan._id;
            const isPro = !plan.isFree;

            return (
              <View
                key={plan._id}
                style={[
                  styles.planCard,
                  isPro && styles.planCardPro,
                  isCurrent && styles.planCardCurrent,
                ]}
              >
                {isPro && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>RECOMMENDED</Text>
                  </View>
                )}

                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceSymbol}>₹</Text>
                  <Text style={styles.priceAmount}>{plan.price}</Text>
                  <Text style={styles.priceCycle}>
                    {plan.isFree ? '/ forever' : ` / ${plan.billingCycle}`}
                  </Text>
                </View>

                {/* FEATURES */}
                <View style={styles.featuresList}>
                  {plan.displayFeatures?.map((feat, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Text style={styles.featureCheck}>✓</Text>
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {/* ACTION BUTTON */}
                {isCurrent ? (
                  <View style={styles.currentBtn}>
                    <Text style={styles.currentBtnText}>✓ Current Plan</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.upgradeBtn, isPro && styles.upgradeBtnPro]}
                    onPress={() => handleSubscribe(plan)}
                    disabled={upgrading === plan._id}
                  >
                    {upgrading === plan._id ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.upgradeBtnText}>
                        {plan.price === 0 ? 'Switch to Free' : `Upgrade for ₹${plan.price}/mo`}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* CANCEL SUB BUTTON */}
        {currentSub && !currentSub.planId?.isFree && currentSub.autoRenew && (
          <TouchableOpacity style={styles.cancelLink} onPress={handleCancel}>
            <Text style={styles.cancelLinkText}>Turn off subscription auto-renewal</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  tagline: { fontSize: 12, fontWeight: '700', color: '#6366f1', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '800', color: '#f8fafc', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },
  usageCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  usageTitle: { fontSize: 12, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  usageLabel: { fontSize: 14, color: '#cbd5e1' },
  usageValue: { fontSize: 15, fontWeight: '700', color: '#6366f1' },
  plansContainer: { gap: 18 },
  planCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#334155', position: 'relative' },
  planCardPro: { borderColor: '#6366f1', borderWidth: 2 },
  planCardCurrent: { backgroundColor: '#182339' },
  popularBadge: { position: 'absolute', top: -11, right: 20, backgroundColor: '#6366f1', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  popularBadgeText: { fontSize: 10, fontWeight: '800', color: 'white', letterSpacing: 0.5 },
  planName: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  priceSymbol: { fontSize: 20, fontWeight: '700', color: '#f8fafc' },
  priceAmount: { fontSize: 32, fontWeight: '800', color: '#f8fafc' },
  priceCycle: { fontSize: 13, color: '#94a3b8', marginLeft: 4 },
  featuresList: { gap: 10, marginBottom: 20, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 14 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureCheck: { fontSize: 14, color: '#22c55e', fontWeight: '800' },
  featureText: { fontSize: 13, color: '#cbd5e1', flex: 1, lineHeight: 18 },
  currentBtn: { backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  currentBtnText: { color: '#94a3b8', fontWeight: '700', fontSize: 14 },
  upgradeBtn: { backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  upgradeBtnPro: { backgroundColor: '#6366f1' },
  upgradeBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  cancelLink: { marginTop: 24, alignItems: 'center', padding: 10 },
  cancelLinkText: { fontSize: 13, color: '#ef4444', textDecorationLine: 'underline' },
});
