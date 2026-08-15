import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

// TODO: Implement ChatScreen
export default function ChatScreen({ navigation, route }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ChatScreen</Text>
      <Text style={styles.sub}>Screen coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 22, fontWeight: '700', color: '#f1f5f9' },
  sub: { fontSize: 14, color: '#64748b', marginTop: 8 },
});
