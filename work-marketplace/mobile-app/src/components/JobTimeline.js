import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../i18n';
import { COLORS } from '../theme';

const STAGES = [
  { key: 'open', labelKey: 'stage_posted', icon: 'document-text-outline' },
  { key: 'assigned', labelKey: 'stage_assigned', icon: 'person-add-outline' },
  { key: 'in_progress', labelKey: 'stage_in_progress', icon: 'flash-outline' },
  { key: 'completed', labelKey: 'stage_completed', icon: 'checkmark-circle-outline' },
  { key: 'paid', labelKey: 'stage_paid', icon: 'cash-outline' },
];

const STAGE_ORDER = {
  open: 0,
  assigned: 1,
  in_progress: 2,
  completed: 3,
  paid: 4,
  cancelled: -1,
};

export default function JobTimeline({ currentStatus = 'open', statusHistory = [] }) {
  const { t } = useTranslation();
  const currentIdx = STAGE_ORDER[currentStatus] ?? 0;

  if (currentStatus === 'cancelled') {
    return (
      <View style={styles.cancelledBox}>
        <Ionicons name="close-circle-outline" size={22} color={COLORS.danger} />
        <Text style={styles.cancelledText}>This job was cancelled.</Text>
      </View>
    );
  }

  const getTimestampForStatus = (statusKey) => {
    const entry = statusHistory?.find((h) => h.status === statusKey);
    if (!entry) return null;
    const date = new Date(entry.timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="git-network-outline" size={16} color={COLORS.primaryLight} />
        <Text style={styles.headerTitle}>Job Status Lifecycle</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {STAGES.map((stage, idx) => {
          const isPassed = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const time = getTimestampForStatus(stage.key);

          return (
            <View key={stage.key} style={styles.stageWrapper}>
              <View style={styles.stageRow}>
                {/* Node circle */}
                <View
                  style={[
                    styles.node,
                    isPassed && styles.nodePassed,
                    isCurrent && styles.nodeCurrent,
                  ]}
                >
                  <Ionicons
                    name={isPassed ? 'checkmark' : stage.icon}
                    size={16}
                    color={isPassed ? '#FFFFFF' : isCurrent ? '#FFFFFF' : COLORS.textMuted}
                  />
                </View>

                {/* Connecting line */}
                {idx < STAGES.length - 1 && (
                  <View
                    style={[
                      styles.line,
                      idx < currentIdx && styles.linePassed,
                    ]}
                  />
                )}
              </View>

              <Text
                style={[
                  styles.label,
                  isCurrent && styles.labelCurrent,
                  isPassed && styles.labelPassed,
                ]}
              >
                {t(stage.labelKey)}
              </Text>
              {time && <Text style={styles.timestamp}>{time}</Text>}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  scroll: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 10,
  },
  stageWrapper: {
    alignItems: 'center',
    width: 86,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  node: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 2,
    borderColor: COLORS.surfaceBorderLight,
  },
  nodePassed: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.successLight,
  },
  nodeCurrent: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  line: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    height: 3,
    backgroundColor: COLORS.surfaceBorderLight,
    zIndex: 1,
  },
  linePassed: {
    backgroundColor: COLORS.success,
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  labelPassed: {
    color: COLORS.textSecondary,
  },
  labelCurrent: {
    color: COLORS.primaryLight,
    fontWeight: '800',
  },
  timestamp: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cancelledBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.danger,
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelledText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '700',
  },
});
