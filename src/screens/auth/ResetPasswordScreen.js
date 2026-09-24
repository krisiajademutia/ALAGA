import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import Input from '../../components/Input';
import Button from '../../components/Button';
import AlertModal from '../../components/AlertModal';
import { requestPasswordResetOtp, verifyPasswordResetOtp } from '../../services/otpService';

export default function ResetPasswordScreen({ navigation, route }) {
  const { currentUser, checkUserExists, resetPasswordWithOtp } = useApp();

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

  // Step 1: Email, Step 2: OTP, Step 3: New Password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(prefilledEmail);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
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

  // ── Step 1: Send Reset Code ───────────────────────────────────────────────
  const handleRequestOtp = async () => {
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
    setSendingOtp(true);

    try {
      // Check if user exists
      const userCheck = await checkUserExists(trimmedEmail);
      if (!userCheck.exists) {
        showDialog({
          type: 'error',
          title: 'Account Not Found',
          message: 'No ALAGA account is registered with this email address. Please check your spelling or sign up.',
        });
        setSendingOtp(false);
        return;
      }

      const userName = userCheck.userData?.name || '';
      const res = await requestPasswordResetOtp(trimmedEmail, userName);

      if (res.success) {
        setStep(2);
        setResendCooldown(60);
        if (res.needsConfig) {
          showDialog({
            type: 'warning',
            title: 'Brevo Notice (Test Code)',
            message: `${res.message || 'Brevo API is running in fallback mode'}\n\nYour test verification code is: ${res.fallbackOtp}`,
          });
        } else {
          showDialog({
            type: 'success',
            title: 'Verification Code Sent',
            message: `A 6-digit password reset code has been sent to ${trimmedEmail}. Please check your inbox or spam folder.`,
          });
        }
      } else {
        showDialog({
          type: 'error',
          title: 'Unable to Send Code',
          message: res.error || 'Please check your internet connection and try again.',
        });
      }
    } catch (err) {
      showDialog({
        type: 'error',
        title: 'Error',
        message: err.message || 'An unexpected error occurred while requesting reset code.',
      });
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Step 2: Resend OTP ───────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || sendingOtp) return;
    setSendingOtp(true);
    try {
      const res = await requestPasswordResetOtp(email.trim());
      if (res.success) {
        setResendCooldown(60);
        if (res.needsConfig) {
          showDialog({
            type: 'warning',
            title: 'Brevo Notice (Test Code)',
            message: `Your new test verification code is: ${res.fallbackOtp}`,
          });
        } else {
          showDialog({
            type: 'success',
            title: 'Code Resent',
            message: `A new 6-digit verification code has been sent to ${email.trim()}.`,
          });
        }
      } else {
        showDialog({
          type: 'error',
          title: 'Resend Failed',
          message: res.error || 'Failed to resend code. Please try again.',
        });
      }
    } catch (err) {
      showDialog({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to resend code.',
      });
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const trimmedOtp = otpCode.trim();
    if (!trimmedOtp || trimmedOtp.length < 6) {
      showDialog({
        type: 'error',
        title: 'Incomplete Code',
        message: 'Please enter the complete 6-digit verification code.',
      });
      return;
    }

    setVerifyingOtp(true);
    try {
      const verifyResult = await verifyPasswordResetOtp(email.trim(), trimmedOtp);
      if (!verifyResult.success) {
        showDialog({
          type: 'error',
          title: 'Verification Failed',
          message: verifyResult.error || 'Incorrect or expired verification code.',
        });
        return;
      }

      // OTP verified! Proceed to Step 3
      setStep(3);
    } catch (err) {
      showDialog({
        type: 'error',
        title: 'Verification Error',
        message: err.message || 'An error occurred during verification. Please try again.',
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ── Step 3: Update Password ──────────────────────────────────────────────
  const handleUpdatePassword = async () => {
    const errs = {};
    if (!newPassword) {
      errs.password = 'New password is required.';
    } else if (newPassword.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (newPassword !== confirmPassword) {
      errs.confirm = 'Passwords do not match.';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await resetPasswordWithOtp(email.trim(), newPassword);
      if (res.success) {
        showDialog({
          type: 'success',
          title: 'Password Updated!',
          message: 'Your password has been reset successfully. You can now log in with your new password.',
          primaryText: 'Sign In Now',
          onPrimaryPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        });
      } else {
        showDialog({
          type: 'error',
          title: 'Reset Failed',
          message: res.error || 'Failed to update password. Please try again.',
        });
      }
    } catch (err) {
      showDialog({
        type: 'error',
        title: 'Update Error',
        message: err.message || 'An error occurred while updating your password.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubtitle = () => {
    if (step === 1) return 'Enter your email to receive a password reset code';
    if (step === 2) return `We sent a 6-digit code to ${email || 'your email'}`;
    return 'Enter your new secure password below';
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
          onPress={() => {
            if (step === 3) setStep(2);
            else if (step === 2) setStep(1);
            else navigation.goBack();
          }}
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
          <Text style={styles.subtitle}>{getSubtitle()}</Text>
        </View>

        {/* Stepper Progress (3 Steps) */}
        <View style={styles.stepContainer}>
          <View style={styles.stepRow}>
            {/* Step 1: Email */}
            <View style={[styles.stepCircle, step >= 1 ? styles.stepCircleActive : styles.stepCircleInactive]}>
              {step > 1 ? (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              ) : (
                <Text style={[styles.stepNumber, step >= 1 ? styles.stepNumberActive : styles.stepNumberInactive]}>1</Text>
              )}
            </View>

            <View style={[styles.stepLine, step >= 2 ? styles.stepLineActive : styles.stepLineInactive]} />

            {/* Step 2: Code */}
            <View style={[styles.stepCircle, step >= 2 ? styles.stepCircleActive : styles.stepCircleInactive]}>
              {step > 2 ? (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              ) : (
                <Text style={[styles.stepNumber, step >= 2 ? styles.stepNumberActive : styles.stepNumberInactive]}>2</Text>
              )}
            </View>

            <View style={[styles.stepLine, step >= 3 ? styles.stepLineActive : styles.stepLineInactive]} />

            {/* Step 3: Password */}
            <View style={[styles.stepCircle, step >= 3 ? styles.stepCircleActive : styles.stepCircleInactive]}>
              <Text style={[styles.stepNumber, step >= 3 ? styles.stepNumberActive : styles.stepNumberInactive]}>3</Text>
            </View>
          </View>

          <View style={styles.stepLabelsRow}>
            <Text style={[styles.stepLabelText, step >= 1 && styles.stepLabelTextActive]}>Email</Text>
            <Text style={[styles.stepLabelText, step >= 2 && styles.stepLabelTextActive]}>Verify</Text>
            <Text style={[styles.stepLabelText, step >= 3 && styles.stepLabelTextActive]}>New Password</Text>
          </View>
        </View>

        {/* ── STEP 1: Enter Email ────────────────────────────────────────── */}
        {step === 1 && (
          <View style={styles.card}>
            <View style={styles.iconCircleHeader}>
              <Ionicons name="key-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Find Your Account</Text>
            <Text style={styles.cardSubtitle}>
              Enter the email address registered with your account. We'll send an official 6-digit OTP code to verify your identity.
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
              title={sendingOtp ? 'Sending Reset Code...' : 'Send Reset Code'}
              onPress={handleRequestOtp}
              loading={sendingOtp}
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
        )}

        {/* ── STEP 2: Verify Code ────────────────────────────────────────── */}
        {step === 2 && (
          <View style={styles.card}>
            {/* Target Email Info Badge */}
            <View style={styles.targetEmailCard}>
              <View style={styles.targetEmailIconWrap}>
                <Ionicons name="mail" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.targetEmailInfo}>
                <Text style={styles.targetEmailLabel}>Code sent to:</Text>
                <Text style={styles.targetEmailText} numberOfLines={1}>{email}</Text>
              </View>
              <TouchableOpacity onPress={() => setStep(1)} style={styles.editEmailBtn}>
                <Text style={styles.editEmailText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cardTitle}>Enter 6-Digit Code</Text>
            <Text style={styles.cardSubtitle}>Check your email inbox or spam folder for the code.</Text>

            <TextInput
              style={styles.otpInput}
              value={otpCode}
              onChangeText={(val) => setOtpCode(val.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="••••••"
              placeholderTextColor="#A0B2AA"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            {/* Resend Action */}
            <View style={styles.resendContainer}>
              {resendCooldown > 0 ? (
                <Text style={styles.cooldownText}>
                  Resend code in <Text style={styles.cooldownSec}>{resendCooldown}s</Text>
                </Text>
              ) : (
                <View style={styles.resendActionRow}>
                  <Text style={styles.noCodeText}>Didn't receive the code? </Text>
                  <TouchableOpacity onPress={handleResendOtp} disabled={sendingOtp}>
                    {sendingOtp ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Text style={styles.resendBtnText}>Resend Code</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Button
              title={verifyingOtp ? 'Verifying Code...' : 'Verify Code'}
              onPress={handleVerifyOtp}
              loading={verifyingOtp}
              disabled={otpCode.length !== 6 || verifyingOtp}
              fullWidth
              style={styles.actionBtn}
            />
          </View>
        )}

        {/* ── STEP 3: New Password ───────────────────────────────────────── */}
        {step === 3 && (
          <View style={styles.card}>
            <View style={styles.iconCircleHeader}>
              <Ionicons name="lock-closed-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Create New Password</Text>
            <Text style={styles.cardSubtitle}>
              Please set a strong password with at least 6 characters to keep your account safe.
            </Text>

            <Input
              label="NEW PASSWORD"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
                if (errors.password) setErrors((e) => ({ ...e, password: null }));
              }}
              error={errors.password}
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />}
            />

            <Input
              label="CONFIRM NEW PASSWORD"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                if (errors.confirm) setErrors((e) => ({ ...e, confirm: null }));
              }}
              error={errors.confirm}
              secureTextEntry
              icon={<Ionicons name="checkmark-circle-outline" size={18} color={COLORS.primary} />}
            />

            <Button
              title="Update Password"
              onPress={handleUpdatePassword}
              loading={loading}
              fullWidth
              style={styles.actionBtn}
            />
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
    paddingBottom: 40,
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

  // Stepper
  stepContainer: {
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepCircleInactive: {
    backgroundColor: '#E5DFD5',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepNumberInactive: {
    color: '#947E68',
  },
  stepLine: {
    flex: 1,
    height: 3,
    marginHorizontal: 8,
    borderRadius: 2,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepLineInactive: {
    backgroundColor: '#E5DFD5',
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#947E68',
    width: 80,
    textAlign: 'center',
  },
  stepLabelTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
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
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: 12,
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
    marginBottom: 16,
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
  targetEmailLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  targetEmailText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  editEmailBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4DDD8',
  },
  editEmailText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // OTP Input
  otpInput: {
    backgroundColor: '#F8F9F8',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 14,
    height: 58,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 14,
    marginBottom: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cooldownText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cooldownSec: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  resendActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noCodeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },

  // Password eye wrap
  passwordFieldWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 36,
    padding: 6,
    zIndex: 2,
  },
});
