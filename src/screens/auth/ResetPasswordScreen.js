import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import Input from '../../components/Input';
import Button from '../../components/Button';
import AlertModal from '../../components/AlertModal';

export default function ResetPasswordScreen({ navigation, route }) {
  const { currentUser, sendPasswordReset } = useApp();

  useEffect(() => {
    if (currentUser) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }
  }, [currentUser]);

  const prefilledEmail = route?.params?.email || '';

  const [email, setEmail] = useState(prefilledEmail);
  const [isSent, setIsSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errors, setErrors] = useState({});
  const timerRef = useRef(null);

  // Custom Alert Modal State
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    primaryText: 'OK',
    onPrimaryPress: null,
  });

  const showDialog = ({
    type = 'info',
    title = '',
    message = '',
    primaryText = 'OK',
    onPrimaryPress = null,
  }) => {
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      primaryText,
      onPrimaryPress: () => {
        setModalConfig((prev) => ({ ...prev, visible: false }));
        if (onPrimaryPress) onPrimaryPress();
      },
    });
  };

  const hideDialog = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendCooldown]);

  const handleSendResetEmail = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrors({ email: 'Email is required.' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setErrors({ email: 'Please enter a valid email address.' });
      return;
    }
    setErrors({});
    setSending(true);

    try {
      const res = await sendPasswordReset(trimmedEmail);
      if (res.success) {
        setIsSent(true);
        setResendCooldown(60);
      } else {
        showDialog({
          type: 'error',
          title: 'Unable to Send Email',
          message: res.error || 'Please check your internet connection and try again.',
        });
      }
    } catch (err) {
      showDialog({
        type: 'error',
        title: 'Error',
        message: err.message || 'An unexpected error occurred while requesting password reset.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || sending) return;
    await handleSendResetEmail();
  };

  const handleOpenMailApp = async () => {
    try {
      if (Platform.OS === 'ios') {
        const canOpen = await Linking.canOpenURL('message:');
        if (canOpen) {
          await Linking.openURL('message:');
          return;
        }
      }
      await Linking.openURL('mailto:');
    } catch (err) {
      console.warn('Could not open mail client:', err);
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
        {/* Top Back Navigation */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Login' }] }))}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Mascot / Logo Header */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../../../assets/alaga-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Title & Subtitle */}
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {isSent
              ? 'Check your inbox or spam folder for the link'
              : 'Enter your email to receive an official password reset link'}
          </Text>
        </View>

        {!isSent ? (
          /* ── STEP 1: Enter Email ────────────────────────────────────────── */
          <View style={styles.card}>
            <View style={styles.iconCircleHeader}>
              <Ionicons name="key-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Find Your Account</Text>
            <Text style={styles.cardSubtitle}>
              Enter the email address registered with your account. We'll send an official, secure link from Firebase to reset your password.
            </Text>

            <Input
              label="REGISTERED EMAIL"
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

            <Button
              title={sending ? 'Sending Reset Link...' : 'Send Reset Link'}
              onPress={handleSendResetEmail}
              loading={sending}
              fullWidth
              style={styles.actionBtn}
            />

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Login' }] }))}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelLinkText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── STEP 2: Sent Confirmation ─────────────────────────────────── */
          <View style={styles.card}>
            <View style={[styles.iconCircleHeader, { backgroundColor: '#E8F5F1' }]}>
              <Ionicons name="mail-open-outline" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Reset Link Sent!</Text>
            <Text style={styles.cardSubtitle}>
              We sent a secure password reset link to:
            </Text>

            <View style={styles.targetEmailCard}>
              <View style={styles.targetEmailIconWrap}>
                <Ionicons name="mail" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.targetEmailInfo}>
                <Text style={styles.targetEmailText} numberOfLines={1}>{email}</Text>
              </View>
            </View>

            {/* Prominent High-Visibility Spam Notice Banner */}
            <View style={styles.spamNoticeCard}>
              <View style={styles.spamNoticeHeader}>
                <Ionicons name="alert-circle" size={20} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={styles.spamNoticeTitle}>Didn't see it in your Inbox?</Text>
              </View>
              <Text style={styles.spamNoticeBody}>
                Please check your <Text style={{ fontWeight: '800', color: '#92400E' }}>Spam</Text> or <Text style={{ fontWeight: '800', color: '#92400E' }}>Junk</Text> folder! Gmail and other mail providers often automatically sort first-time verification links there.
              </Text>
            </View>

            <Text style={styles.instructionText}>
              1. Open your email from ALAGA / Firebase.{'\n'}
              2. Click the secure link to set your new password.{'\n'}
              3. Return here and sign in with your new password!
            </Text>

            {/* Open Mail App Button */}
            <Button
              title="Open Email App"
              onPress={handleOpenMailApp}
              fullWidth
              style={styles.openMailBtn}
            />

            <Button
              title="Back to Sign In"
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Login' }] }))}
              fullWidth
              style={styles.actionBtn}
            />

            {/* Resend Action */}
            <View style={styles.resendContainer}>
              {resendCooldown > 0 ? (
                <Text style={styles.cooldownText}>
                  Resend email in <Text style={{ fontWeight: '700' }}>{resendCooldown}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={sending} activeOpacity={0.7}>
                  <Text style={styles.resendBtnText}>
                    {sending ? 'Sending...' : "Didn't receive the email? Resend"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => {
                setIsSent(false);
                setResendCooldown(0);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelLinkText}>Use a different email</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Blurred Alert Modal */}
      <AlertModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={hideDialog}
        primaryButtonText={modalConfig.primaryText}
        onPrimaryPress={modalConfig.onPrimaryPress}
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
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 90,
    justifyContent: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2ECF0',
    marginBottom: 16,
    alignSelf: 'flex-start',
    ...SHADOWS.subtle,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: 170,
    height: 60,
  },
  titleWrap: {
    marginBottom: 20,
  },
  title: {
    ...FONTS.titleXl,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    ...FONTS.subtitle,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Card
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
  iconCircleHeader: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    alignSelf: 'center',
  },
  cardTitle: {
    ...FONTS.titleLarge,
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitle: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Spam Notice Card
  spamNoticeCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  spamNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  spamNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  spamNoticeBody: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 19,
  },

  instructionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
    backgroundColor: '#F8FAF9',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EFEA',
  },
  openMailBtn: {
    backgroundColor: '#2E7A99',
    marginBottom: 10,
  },
  actionBtn: {
    marginTop: 2,
    backgroundColor: COLORS.primary,
  },
  cancelLink: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelLinkText: {
    ...FONTS.bodyMedium,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Target Email Card
  targetEmailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F6F4',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2EBE5',
  },
  targetEmailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  targetEmailInfo: {
    flex: 1,
  },
  targetEmailText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  resendContainer: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cooldownText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  resendBtnText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
