import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import Input from '../../components/Input';
import Button from '../../components/Button';
import AlertModal from '../../components/AlertModal';
import { requestRegistrationOtp, verifyRegistrationOtp } from '../../services/otpService';

const ROLES = [
  {
    key: 'community',
    label: 'Community User',
    desc: 'Report animals, follow rescues, apply for adoption or foster care.',
    icon: 'person-outline',
  },
  {
    key: 'advocate',
    label: 'Animal Advocate',
    desc: 'Respond to alerts, manage rescued animals, post for adoption.',
    icon: 'medkit-outline',
  },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useApp();
  const [step, setStep] = useState(1); // 1: Role, 2: Details, 3: Verify OTP
  const [role, setRole] = useState('community');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    location: '',
    organization: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errors, setErrors] = useState({});
  const timerRef = useRef(null);

  // Custom Blurred Dialog State
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

  const formatBrevoError = (rawError) => {
    if (!rawError) return 'Please check your internet connection and email address.';
    if (rawError.includes('unrecognised IP address') || rawError.includes('authorised_ips')) {
      return 'Brevo Security Notice:\n\nYour current network IP was flagged by Brevo. Please deactivate IP blocking in your Brevo settings (Security > Authorized IPs) or click the authorization link sent to your Brevo email.';
    }
    return rawError;
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

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validateStep2 = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  // Step 2 Submit: Send OTP via Brevo and transition to Step 3
  const handleRequestOtp = async () => {
    if (!validateStep2()) return;

    setSendingOtp(true);
    try {
      const res = await requestRegistrationOtp(form.email.trim(), form.name.trim());
      if (res.success) {
        setStep(3);
        setResendCooldown(60);
        if (res.needsConfig) {
          showDialog({
            type: 'warning',
            title: 'Brevo Key Needed',
            message: `Brevo is not configured yet in src/config/brevoConfig.js.\n\nFor testing, your generated OTP is: ${res.fallbackOtp}`,
          });
        } else {
          showDialog({
            type: 'success',
            title: 'Verification Code Sent',
            message: `We have sent a 6-digit verification code to ${form.email.trim()}.\n\nPlease check your inbox and spam folder.`,
          });
        }
      } else {
        showDialog({
          type: 'warning',
          title: 'Could Not Send Code',
          message: formatBrevoError(res.error),
        });
      }
    } catch (err) {
      showDialog({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to send verification code.',
      });
    } finally {
      setSendingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || sendingOtp) return;
    setSendingOtp(true);
    try {
      const res = await requestRegistrationOtp(form.email.trim(), form.name.trim());
      if (res.success) {
        setResendCooldown(60);
        if (res.needsConfig) {
          showDialog({
            type: 'warning',
            title: 'Brevo Key Needed',
            message: `Your new test OTP code is: ${res.fallbackOtp}`,
          });
        } else {
          showDialog({
            type: 'success',
            title: 'Code Resent',
            message: `A new verification code has been sent to ${form.email.trim()}.`,
          });
        }
      } else {
        showDialog({
          type: 'error',
          title: 'Resend Failed',
          message: formatBrevoError(res.error),
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

  // Step 3 Submit: Verify OTP and finalize registration in Firebase
  const handleVerifyAndRegister = async () => {
    const trimmedOtp = otpCode.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      showDialog({
        type: 'warning',
        title: 'Incomplete Code',
        message: 'Please enter the complete 6-digit verification code.',
      });
      return;
    }

    const verifyResult = verifyRegistrationOtp(form.email.trim(), trimmedOtp);
    if (!verifyResult.success) {
      showDialog({
        type: 'error',
        title: 'Verification Failed',
        message: verifyResult.error || 'Incorrect or expired code.',
      });
      return;
    }

    // OTP verified successfully! Now register in Firebase Auth and Firestore
    setLoading(true);
    try {
      const r = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
        location: form.location.trim(),
        ...(role === 'advocate' ? { organization: form.organization.trim() } : {}),
      });

      if (!r.success) {
        showDialog({
          type: 'error',
          title: 'Registration Failed',
          message: r.error || 'Please check your details.',
        });
      }
    } catch (err) {
      showDialog({
        type: 'error',
        title: 'Registration Error',
        message: err.message || 'An error occurred during account creation.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (step === 1) return 'Create Account';
    if (step === 2) return 'Account Details';
    return 'Verify Your Email';
  };

  const getSubtitle = () => {
    if (step === 1) return 'Choose your role in the ALAGA community';
    if (step === 2) return 'Fill in your personal information';
    return `We sent a 6-digit code to ${form.email || 'your email'}`;
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
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (step === 3) setStep(2);
            else if (step === 2) setStep(1);
            else navigation.goBack();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Heading */}
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>

        {/* Stepper Progress (3 Steps) */}
        <View style={styles.stepContainer}>
          <View style={styles.stepRow}>
            {/* Step 1: Role */}
            <View style={[styles.stepCircle, step >= 1 ? styles.stepCircleActive : styles.stepCircleInactive]}>
              {step > 1 ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text style={styles.stepNum}>1</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, step >= 1 ? styles.stepLabelActive : styles.stepLabelInactive]}>
              Role
            </Text>

            {/* Connecting line 1 -> 2 */}
            <View
              style={[
                styles.stepLine,
                step >= 2 ? styles.stepLineActive : styles.stepLineInactive,
              ]}
            />

            {/* Step 2: Details */}
            <View
              style={[
                styles.stepCircle,
                step >= 2 ? styles.stepCircleActive : styles.stepCircleInactive,
              ]}
            >
              {step > 2 ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.stepNum,
                    step >= 2 ? styles.stepNumActive : styles.stepNumInactive,
                  ]}
                >
                  2
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                step >= 2 ? styles.stepLabelActive : styles.stepLabelInactive,
              ]}
            >
              Details
            </Text>

            {/* Connecting line 2 -> 3 */}
            <View
              style={[
                styles.stepLine,
                step === 3 ? styles.stepLineActive : styles.stepLineInactive,
              ]}
            />

            {/* Step 3: Verify */}
            <View
              style={[
                styles.stepCircle,
                step === 3 ? styles.stepCircleActive : styles.stepCircleInactive,
              ]}
            >
              <Text
                style={[
                  styles.stepNum,
                  step === 3 ? styles.stepNumActive : styles.stepNumInactive,
                ]}
              >
                3
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                step === 3 ? styles.stepLabelActive : styles.stepLabelInactive,
              ]}
            >
              Verify
            </Text>
          </View>
        </View>

        {step === 1 && (
          /* ── Step 1: Role Selection ────────────────────────── */
          <View style={styles.stepBody}>
            {ROLES.map((r) => {
              const isSelected = role === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  style={[
                    styles.roleCard,
                    isSelected ? styles.roleCardActive : styles.roleCardDefault,
                  ]}
                  onPress={() => setRole(r.key)}
                  activeOpacity={0.88}
                >
                  <View style={[styles.roleIconWrap, isSelected && styles.roleIconWrapActive]}>
                    <Ionicons
                      name={r.icon}
                      size={26}
                      color={isSelected ? COLORS.primary : COLORS.textMuted}
                    />
                  </View>
                  <View style={styles.roleInfo}>
                    <Text style={styles.roleTitle}>{r.label}</Text>
                    <Text style={styles.roleDesc}>{r.desc}</Text>
                  </View>

                  {/* Radio Indicator */}
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <Button
              title="Continue to Account Details"
              onPress={() => setStep(2)}
              fullWidth
              style={styles.primaryBtn}
            />
          </View>
        )}

        {step === 2 && (
          /* ── Step 2: Details Form ─────────────────────────── */
          <View style={styles.stepBody}>
            {/* Selected Role Badge */}
            <View style={styles.roleBadgeRow}>
              <View style={styles.roleBadge}>
                <Ionicons
                  name={role === 'advocate' ? 'medkit' : 'person'}
                  size={13}
                  color={COLORS.primary}
                />
                <Text style={styles.roleBadgeText}>
                  {role === 'advocate' ? 'Animal Advocate' : 'Community User'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setStep(1)}>
                <Text style={styles.changeRoleText}>Change</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="FULL NAME"
              placeholder="Your full name"
              value={form.name}
              onChangeText={(v) => {
                set('name', v);
                if (errors.name) setErrors((e) => ({ ...e, name: null }));
              }}
              error={errors.name}
              autoCapitalize="words"
              icon={<Ionicons name="person-outline" size={18} color={COLORS.primary} />}
            />

            <Input
              label="EMAIL ADDRESS"
              placeholder="your.email@gmail.com"
              value={form.email}
              onChangeText={(v) => {
                set('email', v);
                if (errors.email) setErrors((e) => ({ ...e, email: null }));
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Ionicons name="mail-outline" size={18} color={COLORS.primary} />}
            />

            <Input
              label="PASSWORD"
              placeholder="Min. 6 characters"
              value={form.password}
              onChangeText={(v) => {
                set('password', v);
                if (errors.password) setErrors((e) => ({ ...e, password: null }));
              }}
              error={errors.password}
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />}
            />

            <Input
              label="CONFIRM PASSWORD"
              placeholder="Min. 6 characters"
              value={form.confirm}
              onChangeText={(v) => {
                set('confirm', v);
                if (errors.confirm) setErrors((e) => ({ ...e, confirm: null }));
              }}
              error={errors.confirm}
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />}
            />

            <Input
              label="LOCATION"
              placeholder="City or area (e.g. Pasig City)"
              value={form.location}
              onChangeText={(v) => set('location', v)}
              autoCapitalize="words"
              icon={<Ionicons name="location-outline" size={18} color={COLORS.primary} />}
            />

            {role === 'advocate' && (
              <Input
                label="ORGANIZATION (OPTIONAL)"
                placeholder="Name of your organization / shelter"
                value={form.organization}
                onChangeText={(v) => set('organization', v)}
                autoCapitalize="words"
                icon={<Ionicons name="business-outline" size={18} color={COLORS.primary} />}
              />
            )}

            <Button
              title={sendingOtp ? 'Sending Verification Code...' : 'Send Verification Code'}
              onPress={handleRequestOtp}
              loading={sendingOtp}
              fullWidth
              style={styles.primaryBtn}
            />
          </View>
        )}

        {step === 3 && (
          /* ── Step 3: OTP Verification ─────────────────────── */
          <View style={styles.stepBody}>
            {/* Email Target Card */}
            <View style={styles.targetEmailCard}>
              <View style={styles.targetEmailIconWrap}>
                <Ionicons name="mail" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.targetEmailInfo}>
                <Text style={styles.targetEmailLabel}>Verification sent to:</Text>
                <Text style={styles.targetEmailText} numberOfLines={1}>{form.email}</Text>
              </View>
              <TouchableOpacity onPress={() => setStep(2)} style={styles.editEmailBtn}>
                <Text style={styles.editEmailText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* OTP Entry Card */}
            <View style={styles.otpCard}>
              <Text style={styles.otpCardTitle}>Enter 6-Digit Code</Text>
              <Text style={styles.otpCardHint}>Check your Gmail inbox or spam folder</Text>

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
                    <Text style={styles.noCodeText}>Didn't get the code? </Text>
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
            </View>

            <Button
              title="Verify & Create Account"
              onPress={handleVerifyAndRegister}
              loading={loading}
              disabled={otpCode.length !== 6 || loading}
              fullWidth
              style={styles.primaryBtn}
            />
          </View>
        )}

        {/* Login Link */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.loginBold}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Blurred Background Dialog Box */}
      <AlertModal {...modalConfig} onClose={hideDialog} />
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
    paddingTop: Platform.OS === 'ios' ? 48 : 34,
    paddingBottom: 40,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: SIZES.r20,
    backgroundColor: '#E7F2F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...FONTS.titleXl,
    color: '#1C2E25',
    marginBottom: 4,
  },
  subtitle: {
    ...FONTS.subtitle,
    color: COLORS.textSecondary,
    marginBottom: 22,
  },

  // Stepper Header
  stepContainer: {
    marginBottom: 24,
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: SIZES.r20,
    borderWidth: 1,
    borderColor: '#E6EFEA',
    ...SHADOWS.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepCircleInactive: {
    backgroundColor: '#D1DFE5',
  },
  stepNum: {
    ...FONTS.caption,
    fontWeight: '800',
    color: COLORS.surface,
  },
  stepNumActive: {
    color: COLORS.surface,
  },
  stepNumInactive: {
    color: '#6F8793',
  },
  stepLabel: {
    ...FONTS.bodyMedium,
    fontWeight: '700',
    marginLeft: 8,
    marginRight: 12,
  },
  stepLabelActive: {
    color: COLORS.primary,
  },
  stepLabelInactive: {
    color: COLORS.textMuted,
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginRight: 12,
    borderRadius: 1,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepLineInactive: {
    backgroundColor: '#E2ECF0',
  },

  stepBody: {
    marginBottom: 16,
  },

  // Role Selection Cards
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.r20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    ...SHADOWS.card,
    shadowColor: '#0D1B2A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  roleCardDefault: {
    borderColor: '#E2ECF1',
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F8FA',
  },
  roleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E7F2F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  roleIconWrapActive: {
    backgroundColor: '#D8ECF2',
  },
  roleInfo: {
    flex: 1,
    paddingRight: 8,
  },
  roleTitle: {
    ...FONTS.titleMd,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  roleDesc: {
    ...FONTS.bodyRegular,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C2DFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },

  // Role Badge in Step 2
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E7F2F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.r14,
    borderWidth: 1,
    borderColor: '#C2DFE8',
  },
  roleBadgeText: {
    ...FONTS.caption,
    fontWeight: '700',
    color: COLORS.primary,
  },
  changeRoleText: {
    ...FONTS.caption,
    fontWeight: '700',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },

  // Primary Action Button
  primaryBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
  },

  // Step 3: Target Email Card
  targetEmailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF6F8',
    borderRadius: SIZES.r16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C6E2E9',
  },
  targetEmailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D9EEF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  targetEmailInfo: {
    flex: 1,
  },
  targetEmailLabel: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  targetEmailText: {
    ...FONTS.bodyMedium,
    fontWeight: '700',
    color: COLORS.primary,
  },
  editEmailBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.r10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C6E2E9',
  },
  editEmailText: {
    ...FONTS.caption,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Step 3: OTP Card
  otpCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.r20,
    padding: 22,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2ECF0',
    ...SHADOWS.card,
  },
  otpCardTitle: {
    ...FONTS.titleMd,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  otpCardHint: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  otpInput: {
    width: '100%',
    height: 60,
    backgroundColor: '#F7FAFC',
    borderRadius: SIZES.r14,
    borderWidth: 2,
    borderColor: '#C6E2E9',
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 10,
    color: COLORS.primary,
    marginBottom: 18,
  },

  // Resend Container
  resendContainer: {
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cooldownText: {
    ...FONTS.bodySmall,
    color: COLORS.textMuted,
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
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
  },
  resendBtnText: {
    ...FONTS.bodySmall,
    fontWeight: '800',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },

  // Login Footer
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  loginText: {
    ...FONTS.bodyMedium,
    color: COLORS.textSecondary,
  },
  loginBold: {
    ...FONTS.bodyMedium,
    fontWeight: '800',
    color: COLORS.primary,
  },
});

