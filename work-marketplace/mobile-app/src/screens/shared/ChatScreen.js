import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { getSocket, joinJobRoom, leaveJobRoom } from '../../api/socket';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../theme';

export default function ChatScreen({ route }) {
  const { jobId, name = 'Chat' } = route.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  const fetchMessages = async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get(`/chat/${jobId}/messages`);
      setMessages(data.data.messages || []);
    } catch (err) {
      console.error('Error loading chat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Connect to WebSocket room for instant live messaging
    if (jobId) {
      joinJobRoom(jobId);

      getSocket().then((socket) => {
        if (socket) {
          const handleIncomingMessage = (newMsg) => {
            if (newMsg.jobId === jobId || newMsg.jobId?._id === jobId) {
              setMessages((prev) => {
                if (prev.some((m) => m._id === newMsg._id)) return prev;
                return [...prev, newMsg];
              });
              setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
          };

          socket.on('chat:message', handleIncomingMessage);

          return () => {
            socket.off('chat:message', handleIncomingMessage);
            leaveJobRoom(jobId);
          };
        }
      });
    }

    const interval = setInterval(fetchMessages, 2500); // Live polling sync
    return () => clearInterval(interval);
  }, [jobId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msgText = text.trim();
    setText('');
    setSending(true);

    try {
      if (jobId) {
        const { data } = await api.post(`/chat/${jobId}/messages`, { text: msgText });
        setMessages((prev) => [...prev, data.data.message]);
      } else {
        // Fallback demo local message
        setMessages((prev) => [
          ...prev,
          {
            _id: `local_${Date.now()}`,
            text: msgText,
            senderId: { _id: user?._id, name: user?.name },
            createdAt: new Date(),
          },
        ]);
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId?._id === user?._id || item.senderId === user?._id;

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, SHADOWS.small]}>
          <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
            {item.text}
          </Text>
          <View style={styles.msgFooter}>
            <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMe && (
              <Ionicons
                name={item.readAt ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.readAt ? COLORS.accent : 'rgba(255,255,255,0.6)'}
              />
            )}
          </View>
        </View>
      </View>
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m._id}
          renderItem={renderMessage}
          contentContainerStyle={messages.length === 0 ? styles.emptyContainer : { padding: 16, gap: 10 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="chatbubbles-outline" size={36} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Direct In-App Chat</Text>
              <Text style={styles.emptySubtitle}>Send a message to coordinate job details or timing safely.</Text>
            </View>
          }
        />

        {/* INPUT BAR */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textMuted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={17} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },

  msgRow: { flexDirection: 'row', width: '100%' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextMe: { color: '#FFFFFF', fontWeight: '500' },
  msgTextOther: { color: COLORS.textPrimary },

  msgFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timeText: { fontSize: 10 },
  timeTextMe: { color: 'rgba(255, 255, 255, 0.7)' },
  timeTextOther: { color: COLORS.textMuted },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },

  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 120, paddingHorizontal: 24 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
});
