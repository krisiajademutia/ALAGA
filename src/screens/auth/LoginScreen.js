import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useApp } from '../../context/AppContext';

export default function LoginScreen({ navigation }) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required.';
    if (!password)     e.password = 'Password is required.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const r = login(email.trim(), password);
      setLoading(false);
      if (!r.success) Alert.alert('Login Failed', r.error);
    }, 700);
  };

  const fillDemo = (role) => {
    setEmail(role === 'community' ? 'maria@email.com' : 'juan@email.com');
    setPassword('123456');
    setErrors({});
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoBlock}>
          <View style={styles.logoRing}>
            <Ionicons name="paw" size={34} color={COLORS.primaryDeep} />
          </View>
          <Text style={styles.appName}>ALAGA</Text>
          <Text style={styles.appTagline}>Alert. Respond. Alaga.</Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <Input
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={errors.email}
            icon={<Ionicons name="mail-outline" size={17} color={COLORS.textMuted} />}
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            icon={<Ionicons name="lock-closed-outline" size={17} color={COLORS.textMuted} />}
          />

          <Button title="Log In" onPress={submit} loading={loading} fullWidth />

          {/* Demo buttons */}
          <View style={styles.divRow}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>Quick demo</Text>
            <View style={styles.divLine} />
          </View>
          <View style={styles.demoRow}>
            <TouchableOpacity style={styles.demoBtn} onPress={() => fillDemo('community')}>
              <Ionicons name="person-outline" size={15} color={COLORS.primaryDeep} />
              <Text style={styles.demoBtnText}>Community</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.demoBtn, styles.demoBtnGreen]} onPress={() => fillDemo('advocate')}>
              <Ionicons name="shield-checkmark-outline" size={15} color={COLORS.secondaryDark} />
              <Text style={[styles.demoBtnText, { color: COLORS.secondaryDark }]}>Advocate</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SIZES.lg24,
    paddingTop: SIZES.xl40 + SIZES.md16,
    paddingBottom: SIZES.xl40,
  },

  logoBlock: { alignItems: 'center', marginBottom: SIZES.xl32 },
  logoRing: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.tagBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SIZES.md16,
    ...SHADOWS.card,
  },
  appName:    { fontSize: SIZES.xl + 6, fontWeight: '900', color: COLORS.brown, letterSpacing: 6 },
  appTagline: { fontSize: SIZES.sm, color: COLORS.textMuted, letterSpacing: 1.2, marginTop: 4 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.r20,
    padding: SIZES.lg24,
    marginBottom: SIZES.lg24,
    ...SHADOWS.card,
  },
  title:    { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.brown, marginBottom: 4 },
  subtitle: { fontSize: SIZES.body, color: COLORS.textMuted, marginBottom: SIZES.lg24 },

  divRow:  { flexDirection: 'row', alignItems: 'center', marginVertical: SIZES.md16 },
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.divider },
  divText: { paddingHorizontal: SIZES.sm8 + 4, fontSize: SIZES.sm, color: COLORS.textMuted, fontWeight: '600' },

  demoRow:     { flexDirection: 'row', gap: SIZES.sm8 },
  demoBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SIZES.xs4 + 2,
    paddingVertical: SIZES.sm8 + 2,
    borderRadius: SIZES.r12,
    borderWidth: 1.5, borderColor: COLORS.primaryDeep,
    backgroundColor: COLORS.tagBg,
  },
  demoBtnGreen: { borderColor: COLORS.secondaryDark, backgroundColor: COLORS.advocateBadge },
  demoBtnText:  { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.primaryDeep },

  signupRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupText: { fontSize: SIZES.body, color: COLORS.textSecondary },
  signupLink: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.primaryDeep },
});
