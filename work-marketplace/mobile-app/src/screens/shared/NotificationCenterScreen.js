import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, SafeAreaView,
} from 'react-native';
import api from '../../api/client';
import { useTranslation } from '../../i18n';

const CATEGORY_ICONS = {
  newMatchingJob: '💼',
  applicationUpdates: '📋',
  messages: '💬',
  paymentUpdates: '💰',
  jobReminders: '⏰',
  noApplicantsNudge: '💡',
  subscriptionBilling: '💳',
  marketing: '🎁',
  safety: '🚨',
  system: '🔔',
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
    const icon = CATEGORY_ICONS[item.category] || '🔔';

    return (
      <TouchableOpacity
        style={[styles.notifCard, isUnread && styles.notifCardUnread]}
        onPress={() => handleMarkAsRead(item)}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.categoryIcon}>{icon}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleDateString()} at{' '}
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <Text style={styles.headerTitle}>{t('notifications_title')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
                <Text style={styles.markAllBtnText}>{t('mark_all_read')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => navigation.navigate('NotificationPreferences')}
            >
              <Text style={styles.settingsBtnText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NOTIFICATIONS LIST */}
        <FlatList
          data={notifications}
          keyExtractor={(n) => n._id}
          renderItem={renderNotification}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : { padding: 16, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
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
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1 },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#f8fafc' },
  markAllBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#334155' },
  markAllBtnText: { fontSize: 12, color: '#a5b4fc', fontWeight: '700' },
  settingsBtn: { padding: 6 },
  settingsBtnText: { fontSize: 18 },

  notifCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  notifCardUnread: {
    backgroundColor: '#1e2942',
    borderColor: '#6366f1',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: { fontSize: 18 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '600', color: '#cbd5e1', flex: 1 },
  titleUnread: { color: '#f8fafc', fontWeight: '800' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366f1', marginLeft: 8 },
  body: { fontSize: 13, color: '#94a3b8', lineHeight: 18, marginBottom: 6 },
  timeText: { fontSize: 11, color: '#64748b' },

  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#64748b', marginTop: 6, textAlign: 'center' },
});
