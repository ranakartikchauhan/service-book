import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../theme';

export default function LoginScreen({ navigation }) {
  const { login, loginWithOtp } = useAuth();
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [form, setForm] = useState({ phoneOrEmail: '', password: '', email: '', otp: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handlePasswordLogin = async () => {
    if (!form.phoneOrEmail || !form.password) {
      return Alert.alert('Missing Fields', 'Please enter your phone or email and password.');
    }
    setLoading(true);
    try {
      const isEmail = form.phoneOrEmail.includes('@');
      await login({
        phone: isEmail ? undefined : form.phoneOrEmail,
        email: isEmail ? form.phoneOrEmail : undefined,
        password: form.password,
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Unable to connect to server. Please check your network and API URL.';
      Alert.alert('Login Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!form.email || !form.email.includes('@')) {
      return Alert.alert('Invalid Email', 'Please enter a valid email address.');
    }

    setSendingOtp(true);
    try {
      const { data } = await api.post('/auth/send-otp', {
        email: form.email,
        purpose: 'login',
      });
      setOtpSent(true);
      setTimer(60);
      Alert.alert('📩 Code Sent', data.message || 'Check your email inbox for your 6-digit login code.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send login code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpLogin = async () => {
    if (!form.email || !form.otp) {
      return Alert.alert('Missing Fields', 'Please enter your email and the 6-digit code.');
    }

    setLoading(true);
    try {
      await loginWithOtp({ email: form.email, otp: form.otp });
    } catch (err) {
      Alert.alert('Sign In Failed', err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* BRAND LOGO HEADER */}
        <View style={styles.header}>
          <View style={[styles.logoIconCircle, SHADOWS.glowPrimary]}>
            <Ionicons name="briefcase" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.logo}>WorkMarket</Text>
          <Text style={styles.subtitle}>Verified local services, instant escrow payments</Text>
        </View>

        {/* LOGIN FORM */}
        <View style={[styles.form, SHADOWS.medium]}>
          <Text style={styles.formTitle}>Welcome Back</Text>

          {/* METHOD TOGGLE */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, loginMethod === 'password' && styles.toggleBtnActive]}
              onPress={() => setLoginMethod('password')}
            >
              <Text style={[styles.toggleBtnTxt, loginMethod === 'password' && styles.toggleBtnTxtActive]}>
                Password
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, loginMethod === 'otp' && styles.toggleBtnActive]}
              onPress={() => setLoginMethod('otp')}
            >
              <Text style={[styles.toggleBtnTxt, loginMethod === 'otp' && styles.toggleBtnTxtActive]}>
                Email OTP Code
              </Text>
            </TouchableOpacity>
          </View>

          {loginMethod === 'password' ? (
            /* PASSWORD LOGIN FIELDS */
            <View>
              <Text style={styles.label}>Mobile Number or Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765 43210 or name@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.phoneOrEmail}
                  onChangeText={(v) => setForm({ ...form, phoneOrEmail: v })}
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={(v) => setForm({ ...form, password: v })}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled, SHADOWS.glowPrimary]}
                onPress={handlePasswordLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.btnText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* EMAIL OTP LOGIN FIELDS */
            <View>
              <Text style={styles.label}>Your Registered Email Address</Text>
              <View style={styles.emailRow}>
                <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. yourname@gmail.com"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={form.email}
                    onChangeText={(v) => setForm({ ...form, email: v })}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.sendOtpBtn, (sendingOtp || timer > 0) && styles.btnDisabled]}
                  onPress={handleSendOtp}
                  disabled={sendingOtp || timer > 0}
                  activeOpacity={0.8}
                >
                  {sendingOtp ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.sendOtpBtnTxt}>
                      {timer > 0 ? `${timer}s` : otpSent ? 'Resend' : 'Send Code'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {otpSent && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.label}>6-Digit Verification Code</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="key-outline" size={18} color={COLORS.primaryLight} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { letterSpacing: 6, fontWeight: '800', fontSize: 16 }]}
                      placeholder="••••••"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={form.otp}
                      onChangeText={(v) => setForm({ ...form, otp: v })}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.btn, (!otpSent || loading) && styles.btnDisabled, SHADOWS.glowPrimary]}
                onPress={handleOtpLogin}
                disabled={!otpSent || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.btnText}>Verify & Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>New to WorkMarket? <Text style={styles.linkHighlight}>Create an account</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 22, paddingBottom: 40 },
  header: { marginBottom: 24, alignItems: 'center' },
  logoIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },

  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  formTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 14 },

  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  toggleBtnTxt: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  toggleBtnTxtActive: { color: '#FFFFFF' },

  label: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 6, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
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
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  eyeBtn: { padding: 8 },

  emailRow: { flexDirection: 'row', alignItems: 'center' },
  sendOtpBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOtpBtnTxt: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },

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
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: COLORS.textMuted, fontSize: 13 },
  linkHighlight: { color: COLORS.primaryLight, fontWeight: '800' },
});
