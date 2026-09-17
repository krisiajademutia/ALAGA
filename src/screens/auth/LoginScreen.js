import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import AlertModal from '../../components/AlertModal';

export default function LoginScreen({ navigation }) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Custom Blurred Dialog State
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  });

  const showDialog = (type, title, message) => {
    setModalConfig({ visible: true, type, title, message });
  };

  const hideDialog = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required.';
    if (!password) e.password = 'Password is required.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const r = await login(email.trim(), password);
      if (!r.success) {
        showDialog(
          'error',
          'Sign In Failed',
          r.error || 'Incorrect email or password.'
        );
      }
    } catch (err) {
      showDialog('error', 'Sign In Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
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
        {/* Top ALAGA Mascot Logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../../../assets/alaga-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Alert · Respond · Alaga</Text>
        </View>

        {/* Clean White Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>
            Sign in with your email and password
          </Text>

          <Input
            label="EMAIL"
            placeholder="your@email.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((e) => ({ ...e, email: null }));
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Ionicons name="mail-outline" size={18} color={COLORS.primary} />}
          />

          <Input
            label="PASSWORD"
            placeholder="Enter your password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors((e) => ({ ...e, password: null }));
            }}
            error={errors.password}
            secureTextEntry
            icon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />}
          />

          <Button
            title="Sign In"
            onPress={submit}
            loading={loading}
            fullWidth
            style={styles.signInBtn}
          />
        </View>

        {/* Sign up Link */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don’t have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Blurred Background Dialog Box */}
      <AlertModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={hideDialog}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 44 : 32,
    paddingBottom: 36,
    justifyContent: 'center',
  },

  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  logoImage: {
    width: 220,
    height: 80,
  },
  tagline: {
    ...FONTS.caption,
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginTop: 4,
    fontWeight: '600',
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.r20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#E2ECF0',
    ...SHADOWS.card,
    shadowColor: '#0D1B2A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    ...FONTS.titleXl,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...FONTS.subtitle,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },

  signInBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
  },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  signupText: {
    ...FONTS.bodyMedium,
    color: COLORS.textSecondary,
  },
  signupLink: {
    ...FONTS.bodyMedium,
    fontWeight: '800',
    color: COLORS.primary,
  },
});


