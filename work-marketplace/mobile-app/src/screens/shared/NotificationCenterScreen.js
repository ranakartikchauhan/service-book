import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { useTranslation } from '../../i18n';
import { COLORS, SHADOWS } from '../../theme';

const CATEGORY_ICONS = {
  newMatchingJob: { icon: 'briefcase', color: COLORS.primaryLight },
  applicationUpdates: { icon: 'clipboard', color: COLORS.accent },
  messages: { icon: 'chatbubbles', color: '#A78BFA' },
  paymentUpdates: { icon: 'wallet', color: COLORS.success },
  jobReminders: { icon: 'alarm', color: COLORS.warning },
  noApplicantsNudge: { icon: 'bulb', color: '#FBBF24' },
  subscriptionBilling: { icon: 'card', color: COLORS.accent },
  marketing: { icon: 'gift', color: '#F472B6' },
  safety: { icon: 'shield-alert', color: COLORS.danger },
  system: { icon: 'notifications', color: COLORS.textSecondary },
};

export default function NotificationCenterScreen({ navigation }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data.notifications || []);
      setUnreadCount(data.data.unreadCount || 0);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (item) => {
    if (item.readAt) return;
    try {
      await api.patch(`/notifications/${item._id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, readAt: new Date() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
      setUnreadCount(0);
    } catch (err) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const renderNotification = ({ item }) => {
    const isUnread = !item.readAt;
    const catConfig = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.system;

    return (
      <TouchableOpacity
        style={[styles.notifCard, isUnread && styles.notifCardUnread, SHADOWS.small]}
        onPress={() => handleMarkAsRead(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${catConfig.color}15` }]}>
          <Ionicons name={catConfig.icon} size={20} color={catConfig.color} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.body}>{item.body}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.timeText}>
              {new Date(item.createdAt).toLocaleDateString()} at{' '}
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
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
      <View style={styles.container}>
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <Text style={styles.headerTitle}>{t('notifications_title')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
                <Text style={styles.markAllBtnText}>{t('mark_all_read')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => navigation.navigate('NotificationPreferences')}
            >
              <Ionicons name="settings-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* NOTIFICATIONS LIST */}
        <FlatList
          data={notifications}
          keyExtractor={(n) => n._id}
          renderItem={renderNotification}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : { padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="mail-open-outline" size={38} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>{t('no_notifications')}</Text>
              <Text style={styles.emptySubtitle}>You're all caught up with your latest job alerts.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.surfaceLight },
  markAllBtnText: { fontSize: 12, color: COLORS.primaryLight, fontWeight: '700' },
  settingsBtn: { padding: 6 },

  notifCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  notifCardUnread: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderColor: COLORS.primary,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, flex: 1 },
  titleUnread: { color: COLORS.textPrimary, fontWeight: '800' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 8 },
  body: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginBottom: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, color: COLORS.textMuted },

  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 24 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 6, textAlign: 'center' },
});
