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

const ROLES = [
  { key: 'community', label: 'Community User', desc: 'Report animals, follow rescues, apply for adoption or foster care.', icon: 'person', color: COLORS.primaryDeep, bg: COLORS.tagBg },
  { key: 'advocate',  label: 'Animal Advocate', desc: 'Respond to alerts, manage rescued animals, post for adoption.', icon: 'shield-checkmark', color: COLORS.secondaryDark, bg: COLORS.advocateBadge },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useApp();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', location: '', organization: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validateStep2 = () => {
    const e = {};
    if (!form.name.trim())  e.name = 'Full name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password)     e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = () => {
    if (!validateStep2()) return;
    setLoading(true);
    setTimeout(() => {
      const r = register({
        name: form.name.trim(), email: form.email.trim(),
        password: form.password, role,
        location: form.location.trim(),
        ...(role === 'advocate' ? { organization: form.organization.trim() } : {}),
      });
      setLoading(false);
      if (!r.success) Alert.alert('Registration Failed', r.error);
    }, 700);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity
          style={styles.back}
          onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.brown} />
        </TouchableOpacity>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          {step === 1 ? 'Choose your role in the ALAGA community' : 'Fill in your details'}
        </Text>

        {/* Step bar */}
        <View style={styles.stepBar}>
          {[1, 2].map((s, i) => (
            <React.Fragment key={s}>
              <View style={[styles.stepCircle, step >= s && styles.stepCircleOn]}>
                {step > s
                  ? <Ionicons name="checkmark" size={13} color="#fff" />
                  : <Text style={[styles.stepNum, step >= s && { color: '#fff' }]}>{s}</Text>}
              </View>
              <Text style={[styles.stepLabel, step >= s && styles.stepLabelOn]}>
                {s === 1 ? 'Role' : 'Details'}
              </Text>
              {i === 0 && (
                <View style={[styles.stepLine, step > 1 && styles.stepLineOn]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {step === 1 ? (
          <View style={styles.roleList}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleCard, role === r.key && { borderColor: r.color, borderWidth: 2 }]}
                onPress={() => setRole(r.key)}
                activeOpacity={0.85}
              >
                <View style={[styles.roleIcon, { backgroundColor: r.bg }]}>
                  <Ionicons name={r.icon} size={26} color={r.color} />
                </View>
                <View style={styles.roleText}>
                  <Text style={[styles.roleLabel, { color: r.color }]}>{r.label}</Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                </View>
                {role === r.key ? (
                  <Ionicons name="checkmark-circle" size={20} color={r.color} />
                ) : null}
              </TouchableOpacity>
            ))}
            <Button
              title="Continue"
              onPress={() => {
                if (!role) { Alert.alert('Select a role', 'Please choose how you want to use ALAGA.'); return; }
                setStep(2);
              }}
              fullWidth
              style={{ marginTop: SIZES.sm8 }}
            />
          </View>
        ) : (
          <View>
            <Input label="Full Name"   placeholder="Your full name"     value={form.name}   onChangeText={(v) => set('name', v)}   autoCapitalize="words"    error={errors.name}     icon={<Ionicons name="person-outline"        size={17} color={COLORS.textMuted} />} />
            <Input label="Email"       placeholder="your@email.com"     value={form.email}  onChangeText={(v) => set('email', v)}  keyboardType="email-address" error={errors.email}  icon={<Ionicons name="mail-outline"          size={17} color={COLORS.textMuted} />} />
            <Input label="Password"    placeholder="Min. 6 characters"  value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry error={errors.password} icon={<Ionicons name="lock-closed-outline"   size={17} color={COLORS.textMuted} />} />
            <Input label="Confirm Password" placeholder="Re-enter password" value={form.confirm} onChangeText={(v) => set('confirm', v)} secureTextEntry error={errors.confirm} icon={<Ionicons name="lock-closed-outline"   size={17} color={COLORS.textMuted} />} />
            <Input label="Location (optional)" placeholder="City or area" value={form.location} onChangeText={(v) => set('location', v)} autoCapitalize="words" icon={<Ionicons name="location-outline" size={17} color={COLORS.textMuted} />} />
            {role === 'advocate' ? (
              <Input label="Organization (optional)" placeholder="Rescue group or shelter name" value={form.organization} onChangeText={(v) => set('organization', v)} autoCapitalize="words" icon={<Ionicons name="business-outline" size={17} color={COLORS.textMuted} />} />
            ) : null}
            <Button title="Create Account" onPress={submit} loading={loading} fullWidth style={{ marginTop: SIZES.xs4 }} />
          </View>
        )}

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SIZES.lg24, paddingTop: SIZES.xl40, paddingBottom: SIZES.xl40 },

  back:     { marginBottom: SIZES.md16 },
  title:    { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.brown, marginBottom: SIZES.xs4 + 2 },
  subtitle: { fontSize: SIZES.body, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SIZES.lg24 },

  stepBar: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.xl32 },
  stepCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepCircleOn: { backgroundColor: COLORS.primaryDeep },
  stepNum:      { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textMuted },
  stepLabel:    { fontSize: SIZES.sm, color: COLORS.textMuted, fontWeight: '600', marginLeft: SIZES.xs4 + 2, marginRight: SIZES.sm8 },
  stepLabelOn:  { color: COLORS.primaryDeep },
  stepLine:     { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: SIZES.sm8 },
  stepLineOn:   { backgroundColor: COLORS.primaryDeep },

  roleList: {},
  roleCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.r16,
    padding: SIZES.md16,
    marginBottom: SIZES.md16,
    borderWidth: 1.5, borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  roleIcon:  { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: SIZES.md16 },
  roleText:  { flex: 1 },
  roleLabel: { fontSize: SIZES.md, fontWeight: '700', marginBottom: 3 },
  roleDesc:  { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 18 },

  loginRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.lg24 },
  loginText: { fontSize: SIZES.body, color: COLORS.textSecondary },
  loginLink: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.primaryDeep },
});
