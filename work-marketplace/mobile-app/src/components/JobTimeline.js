import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from '../i18n';

const STAGES = [
  { key: 'open', labelKey: 'stage_posted', icon: '📝' },
  { key: 'assigned', labelKey: 'stage_assigned', icon: '🤝' },
  { key: 'in_progress', labelKey: 'stage_in_progress', icon: '⚡' },
  { key: 'completed', labelKey: 'stage_completed', icon: '✅' },
  { key: 'paid', labelKey: 'stage_paid', icon: '💰' },
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
        <Text style={styles.cancelledText}>🚫 This job was cancelled.</Text>
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
      <Text style={styles.headerTitle}>Job Status Lifecycle</Text>
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
                  <Text style={styles.nodeIcon}>
                    {isPassed ? '✓' : stage.icon}
                  </Text>
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
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 12,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  scroll: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 10,
  },
  stageWrapper: {
    alignItems: 'center',
    width: 90,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  node: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#475569',
  },
  nodePassed: {
    backgroundColor: '#166534',
    borderColor: '#22c55e',
  },
  nodeCurrent: {
    backgroundColor: '#312e81',
    borderColor: '#6366f1',
    transform: [{ scale: 1.15 }],
  },
  nodeIcon: {
    fontSize: 14,
    color: 'white',
  },
  line: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    height: 3,
    backgroundColor: '#334155',
    zIndex: 1,
  },
  linePassed: {
    backgroundColor: '#22c55e',
  },
  label: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  labelPassed: {
    color: '#94a3b8',
  },
  labelCurrent: {
    color: '#a5b4fc',
    fontWeight: '800',
  },
  timestamp: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  cancelledBox: {
    backgroundColor: '#3b1c24',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginVertical: 12,
  },
  cancelledText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
