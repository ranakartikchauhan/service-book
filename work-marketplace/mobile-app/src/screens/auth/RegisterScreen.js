import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.password) {
      return Alert.alert('Missing Fields', 'Please fill in all fields.');
    }
    if (form.password !== form.confirmPassword) {
      return Alert.alert('Password Mismatch', 'Passwords do not match.');
    }
    if (form.password.length < 6) {
      return Alert.alert('Weak Password', 'Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      await register({ name: form.name, phone: form.phone, password: form.password });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Unable to connect to server. Please check your network and API URL.';
      Alert.alert('Registration Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* BRAND HEADER */}
        <View style={styles.header}>
          <View style={[styles.logoIconCircle, SHADOWS.glowPrimary]}>
            <Ionicons name="sparkles" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.logo}>WorkMarket</Text>
          <Text style={styles.subtitle}>Join thousands of workers and households</Text>
        </View>

        {/* REGISTRATION FORM */}
        <View style={[styles.form, SHADOWS.medium]}>
          <Text style={styles.formTitle}>Create Account</Text>
          <Text style={styles.formSubtitle}>Quick registration takes less than a minute</Text>

          {/* NAME */}
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Ravi Kumar"
              placeholderTextColor={COLORS.textMuted}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />
          </View>

          {/* PHONE */}
          <Text style={styles.label}>Mobile Phone Number *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(v) => setForm({ ...form, phone: v })}
              autoComplete="tel"
            />
          </View>

          {/* PASSWORD */}
          <Text style={styles.label}>Create Password *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Minimum 6 characters"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* CONFIRM PASSWORD */}
          <Text style={styles.label}>Confirm Password *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPassword}
              value={form.confirmPassword}
              onChangeText={(v) => setForm({ ...form, confirmPassword: v })}
            />
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled, SHADOWS.glowPrimary]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.btnText}>Create Free Account</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.terms}>
            By signing up, you agree to our Terms of Service & Razorpay Escrow Protection Policy.
          </Text>

          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  header: { marginBottom: 24, alignItems: 'center', marginTop: 10 },
  logoIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logo: { fontSize: 30, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },

  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  formTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  formSubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2, marginBottom: 12 },

  label: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 5, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderLight,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 13,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  eyeBtn: { padding: 8 },

  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  terms: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 14, lineHeight: 16 },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: COLORS.textMuted, fontSize: 13 },
  linkHighlight: { color: COLORS.primaryLight, fontWeight: '800' },
});
