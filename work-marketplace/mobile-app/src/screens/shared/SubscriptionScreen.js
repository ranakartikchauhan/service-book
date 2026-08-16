import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../theme';

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
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const activePlanId = currentSub?.planId?._id || currentSub?.planId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.badgePill}>
            <Ionicons name="sparkles" size={12} color={COLORS.primaryLight} />
            <Text style={styles.tagline}>
              {role === 'worker' ? 'WORKER PRO SUBSCRIPTION' : 'POSTER BUSINESS SUBSCRIPTION'}
            </Text>
          </View>
          <Text style={styles.title}>
            {role === 'worker' ? 'Earn More & Get Hired Faster' : 'Hire Top Workers on Priority'}
          </Text>
          <Text style={styles.subtitle}>
            {role === 'worker'
              ? 'Unlock unlimited applications, top search ranking, and lower platform commission fees.'
              : 'Unlock unlimited job postings, automated recurring scheduling, and priority matching.'}
          </Text>
        </View>

        {/* CURRENT USAGE SUMMARY */}
        {currentSub && (
          <View style={[styles.usageCard, SHADOWS.small]}>
            <View style={styles.usageTitleRow}>
              <Ionicons name="analytics-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.usageTitle}>Current Billing Cycle Usage</Text>
            </View>
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
                  isPro && SHADOWS.glowPrimary,
                ]}
              >
                {isPro && (
                  <View style={styles.popularBadge}>
                    <Ionicons name="star" size={10} color="#FFFFFF" />
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
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {/* ACTION BUTTON */}
                {isCurrent ? (
                  <View style={styles.currentBtn}>
                    <Ionicons name="checkmark" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.currentBtnText}>Current Active Plan</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.upgradeBtn, isPro && styles.upgradeBtnPro]}
                    onPress={() => handleSubscribe(plan)}
                    disabled={upgrading === plan._id}
                    activeOpacity={0.8}
                  >
                    {upgrading === plan._id ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="flash-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.upgradeBtnText}>
                          {plan.price === 0 ? 'Switch to Free' : `Upgrade for ₹${plan.price}/mo`}
                        </Text>
                      </View>
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
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 18, paddingBottom: 40 },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },

  header: { alignItems: 'center', marginBottom: 24, marginTop: 4 },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  tagline: { fontSize: 11, fontWeight: '800', color: COLORS.primaryLight, letterSpacing: 0.6 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 10 },

  usageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  usageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  usageTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  usageLabel: { fontSize: 13, color: COLORS.textSecondary },
  usageValue: { fontSize: 15, fontWeight: '900', color: COLORS.primaryLight },

  plansContainer: { gap: 18 },
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    position: 'relative',
  },
  planCardPro: { borderColor: COLORS.primary, borderWidth: 2 },
  planCardCurrent: { backgroundColor: 'rgba(99, 102, 241, 0.05)' },

  popularBadge: {
    position: 'absolute',
    top: -11,
    right: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popularBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },

  planName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 14 },
  priceSymbol: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  priceAmount: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary },
  priceCycle: { fontSize: 13, color: COLORS.textMuted, marginLeft: 4 },

  featuresList: { gap: 10, marginBottom: 18, borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder, paddingTop: 14 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 13, color: COLORS.textSecondary, flex: 1, lineHeight: 18 },

  currentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 14,
    borderRadius: 14,
  },
  currentBtnText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 14 },

  upgradeBtn: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtnPro: { backgroundColor: COLORS.primary },
  upgradeBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  cancelLink: { marginTop: 20, alignItems: 'center', padding: 10 },
  cancelLinkText: { fontSize: 12, color: COLORS.danger, textDecorationLine: 'underline' },
});
