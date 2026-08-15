import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

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
      Alert.alert('Registration Failed', err.response?.data?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>WorkMarket</Text>
          <Text style={styles.subtitle}>Create your account — it's free</Text>
        </View>

        <View style={styles.form}>
          {[
            { label: 'Full Name', key: 'name', placeholder: 'Ravi Kumar', keyboardType: 'default', secure: false },
            { label: 'Phone Number', key: 'phone', placeholder: '+91 98765 43210', keyboardType: 'phone-pad', secure: false },
            { label: 'Password', key: 'password', placeholder: '••••••••', keyboardType: 'default', secure: true },
            { label: 'Confirm Password', key: 'confirmPassword', placeholder: '••••••••', keyboardType: 'default', secure: true },
          ].map((field) => (
            <View key={field.key}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor="#64748b"
                keyboardType={field.keyboardType}
                secureTextEntry={field.secure}
                value={form[field.key]}
                onChangeText={(v) => setForm({ ...form, [field.key]: v })}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <Text style={styles.terms}>
            By creating an account, you agree to our Terms of Service and Privacy Policy.
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
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 32, alignItems: 'center' },
  logo: { fontSize: 36, fontWeight: '800', color: '#6366f1', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#94a3b8', marginTop: 8 },
  form: { backgroundColor: '#1e293b', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#334155' },
  label: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#334155', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#f1f5f9', fontSize: 16, borderWidth: 1, borderColor: '#475569' },
  btn: { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  terms: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 16, lineHeight: 16 },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#94a3b8', fontSize: 14 },
  linkHighlight: { color: '#6366f1', fontWeight: '700' },
});
