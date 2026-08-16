import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { COLORS, SHADOWS } from '../../theme';

export default function ContactSupportScreen({ navigation }) {
  const [contactInfo, setContactInfo] = useState({
    helplinePhone: '+916396934224',
    helplineDisplay: '+91 63969 34224',
    whatsappPhone: '916396934224',
    whatsappDefaultText: 'Hello WorkMarket Support, I need help with my account/job.',
    supportEmail: 'support@workmarket.in',
    workingHours: 'Monday - Sunday, 8:00 AM - 10:00 PM IST',
    faqs: [],
  });

  const [expandedFaq, setExpandedFaq] = useState(null);
  const [ticketForm, setTicketForm] = useState({
    category: 'job_issue',
    subject: '',
    message: '',
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const { data } = await api.get('/support/contact-info');
        if (data?.data) {
          setContactInfo(data.data);
        }
      } catch (err) {
        console.warn('Error fetching support info:', err);
      }
    };
    fetchContactInfo();
  }, []);

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/${contactInfo.whatsappPhone}?text=${encodeURIComponent(contactInfo.whatsappDefaultText)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Not Available', 'Please install WhatsApp or call our helpline number directly.');
    });
  };

  const handleCallHelpline = () => {
    Linking.openURL(`tel:${contactInfo.helplinePhone}`).catch(() => {
      Alert.alert('Phone Call Error', 'Unable to initiate phone call from device.');
    });
  };

  const handleSendEmail = () => {
    Linking.openURL(`mailto:${contactInfo.supportEmail}?subject=WorkMarket Support Request`).catch(() => {
      Alert.alert('Email App Error', 'Unable to open email client.');
    });
  };

  const handleSubmitTicket = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      return Alert.alert('Missing Fields', 'Please enter a subject and detailed message.');
    }

    setSubmittingTicket(true);
    try {
      await api.post('/support/ticket', ticketForm);
      Alert.alert('Ticket Submitted ✅', 'Your support ticket has been received. Our support team will review and reply shortly.');
      setTicketForm({ category: 'job_issue', subject: '', message: '' });
      setShowTicketModal(false);
    } catch (err) {
      Alert.alert('Submission Error', err.response?.data?.message || 'Failed to submit support ticket.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HERO SUPPORT BANNER */}
        <View style={[styles.heroCard, SHADOWS.medium]}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="headset" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>24/7 Customer Support & Help</Text>
          <Text style={styles.heroSubtitle}>
            We are here to assist workers and posters with payments, job disputes, safety, and app questions.
          </Text>
          <View style={styles.hoursBadge}>
            <Ionicons name="time-outline" size={13} color={COLORS.primaryLight} />
            <Text style={styles.hoursText}>{contactInfo.workingHours}</Text>
          </View>
        </View>

        {/* 1-TAP CONTACT ACTION BUTTONS */}
        <Text style={styles.sectionHeader}>Instant Help Channels</Text>
        <View style={styles.channelGrid}>
          {/* WHATSAPP */}
          <TouchableOpacity
            style={[styles.channelCard, SHADOWS.small, { borderColor: '#10b981' }]}
            onPress={handleOpenWhatsApp}
            activeOpacity={0.8}
          >
            <View style={[styles.channelIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#10b981" />
            </View>
            <Text style={styles.channelTitle}>WhatsApp Chat</Text>
            <Text style={styles.channelSub}>Instant 2-minute reply</Text>
          </TouchableOpacity>

          {/* CALL HELPLINE */}
          <TouchableOpacity
            style={[styles.channelCard, SHADOWS.small, { borderColor: '#6366f1' }]}
            onPress={handleCallHelpline}
            activeOpacity={0.8}
          >
            <View style={[styles.channelIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Ionicons name="call" size={22} color="#6366f1" />
            </View>
            <Text style={styles.channelTitle}>Direct Helpline</Text>
            <Text style={styles.channelSub}>{contactInfo.helplineDisplay}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.channelGrid}>
          {/* EMAIL SUPPORT */}
          <TouchableOpacity
            style={[styles.channelCard, SHADOWS.small, { borderColor: '#38bdf8' }]}
            onPress={handleSendEmail}
            activeOpacity={0.8}
          >
            <View style={[styles.channelIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="mail" size={22} color="#38bdf8" />
            </View>
            <Text style={styles.channelTitle}>Email Support</Text>
            <Text style={styles.channelSub}>{contactInfo.supportEmail}</Text>
          </TouchableOpacity>

          {/* IN-APP TICKET */}
          <TouchableOpacity
            style={[styles.channelCard, SHADOWS.small, { borderColor: '#f59e0b' }]}
            onPress={() => setShowTicketModal(!showTicketModal)}
            activeOpacity={0.8}
          >
            <View style={[styles.channelIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="ticket" size={22} color="#f59e0b" />
            </View>
            <Text style={styles.channelTitle}>Submit Ticket</Text>
            <Text style={styles.channelSub}>{showTicketModal ? 'Close Form' : 'Log official inquiry'}</Text>
          </TouchableOpacity>
        </View>

        {/* IN-APP TICKET SUBMISSION FORM */}
        {showTicketModal && (
          <View style={[styles.ticketBox, SHADOWS.medium]}>
            <Text style={styles.ticketBoxTitle}>📝 Submit Official Support Request</Text>
            <Text style={styles.ticketBoxSub}>Our operations & safety team will review your inquiry.</Text>

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {[
                { key: 'job_issue', label: 'Job Issue' },
                { key: 'payment', label: 'Payment / Escrow' },
                { key: 'safety', label: 'Safety / Dispute' },
                { key: 'account', label: 'Account Help' },
              ].map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catChip, ticketForm.category === c.key && styles.catChipActive]}
                  onPress={() => setTicketForm({ ...ticketForm, category: c.key })}
                >
                  <Text style={[styles.catChipText, ticketForm.category === c.key && styles.catChipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Issue with payment disbursement for cleaning job"
              placeholderTextColor={COLORS.textMuted}
              value={ticketForm.subject}
              onChangeText={(v) => setTicketForm({ ...ticketForm, subject: v })}
            />

            <Text style={styles.inputLabel}>Detailed Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Please describe the issue with any relevant job titles, dates, or worker/poster names..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              value={ticketForm.message}
              onChangeText={(v) => setTicketForm({ ...ticketForm, message: v })}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submittingTicket && styles.btnDisabled]}
              onPress={handleSubmitTicket}
              disabled={submittingTicket}
            >
              {submittingTicket ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Support Request</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* FREQUENTLY ASKED QUESTIONS */}
        {contactInfo.faqs && contactInfo.faqs.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>
            {contactInfo.faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <View key={idx} style={[styles.faqCard, SHADOWS.small]}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => setExpandedFaq(isExpanded ? null : idx)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.faqBody}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, paddingBottom: 40 },

  heroCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  heroIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 12,
  },
  hoursText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },

  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 12,
  },
  channelGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  channelCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  channelIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  channelTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
  },
  channelSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },

  ticketBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#475569',
    marginTop: 12,
    marginBottom: 16,
  },
  ticketBoxTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  ticketBoxSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    marginBottom: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  catChip: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },

  faqCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    flex: 1,
    paddingRight: 10,
  },
  faqBody: {
    padding: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
  },
  faqAnswer: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginTop: 8,
  },
});
