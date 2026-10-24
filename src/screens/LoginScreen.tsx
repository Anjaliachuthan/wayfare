import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { colors, font, radius } from '../theme';
import { validateEmail, validatePassword } from '../utils/validation';

export default function LoginScreen() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    const e = { email: validateEmail(email), password: validatePassword(password) };
    setErrors(e);
    if (e.email || e.password) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Ionicons name="git-compare-outline" size={22} color="#fff" />
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to plan a trip and follow your route turn by turn.</Text>

          <View style={{ marginTop: 28 }}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: null }); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(t) => { setPassword(t); if (errors.password) setErrors({ ...errors, password: null }); }}
              secure
              error={errors.password}
            />
            <TouchableOpacity onPress={() => showToast('Forgot password: Coming soon')}>
              <Text style={styles.forgot}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Log in" onPress={onLogin} loading={loading} />
          <View style={styles.signupRow}>
            <Text style={styles.muted}>New to Wayfare? </Text>
            <TouchableOpacity onPress={() => showToast('Create account: Coming soon')}>
              <Text style={styles.link}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 36 },
  logo: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text, marginTop: 24 },
  subtitle: { fontSize: font.sm, color: colors.muted, marginTop: 8, lineHeight: 18 },
  forgot: { color: colors.primary, fontSize: font.sm, fontWeight: '600' },
  footer: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  muted: { fontSize: font.sm, color: colors.muted },
  link: { fontSize: font.sm, color: colors.text, fontWeight: '700' },
});
