import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { brevoConfig, isBrevoConfigured } from '../config/brevoConfig';

// Storage keys
const OTP_STORAGE_PREFIX = '@alaga_otp_';
const OTP_VALIDITY_MS = 15 * 60 * 1000; // 15 minutes validity

// In-memory fast cache (unified so registration and reset stores never miss each other)
const otpMemoryStore = new Map();
export const registrationOtpStore = otpMemoryStore;
export const passwordResetOtpStore = otpMemoryStore;

/**
 * Generate a 6-digit numeric OTP code
 */
export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Persist an OTP record to Memory, AsyncStorage, and Firestore
 */
async function saveOtpRecord(cleanEmail, record) {
  // 1. In-memory
  otpMemoryStore.set(cleanEmail, record);

  // 2. AsyncStorage (persists across app minimization, backgrounding, reloads)
  try {
    await AsyncStorage.setItem(OTP_STORAGE_PREFIX + cleanEmail, JSON.stringify(record));
  } catch (err) {
    console.warn('[otpService] AsyncStorage save notice:', err.message);
  }

  // 3. Firestore (remote sync for cross-device/restart resilience)
  if (db) {
    try {
      setDoc(doc(db, 'otps', cleanEmail), {
        otp: record.otp,
        expiresAt: record.expiresAt,
        attempts: record.attempts || 0,
        purpose: record.purpose || 'general',
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    } catch (err) {
      // Non-blocking
    }
  }
}

/**
 * Retrieve an OTP record checking Memory -> AsyncStorage -> Firestore
 */
async function getOtpRecord(cleanEmail) {
  // 1. Memory check (instant)
  if (otpMemoryStore.has(cleanEmail)) {
    return otpMemoryStore.get(cleanEmail);
  }

  // 2. AsyncStorage check
  try {
    const raw = await AsyncStorage.getItem(OTP_STORAGE_PREFIX + cleanEmail);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.otp) {
        otpMemoryStore.set(cleanEmail, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[otpService] AsyncStorage read notice:', err.message);
  }

  // 3. Firestore check
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'otps', cleanEmail));
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.otp) {
          otpMemoryStore.set(cleanEmail, data);
          return data;
        }
      }
    } catch (err) {
      // Non-blocking
    }
  }

  return null;
}

/**
 * Remove OTP record from all layers once used or expired
 */
async function clearOtpRecord(cleanEmail) {
  otpMemoryStore.delete(cleanEmail);
  try {
    await AsyncStorage.removeItem(OTP_STORAGE_PREFIX + cleanEmail);
  } catch (err) {}
  if (db) {
    try {
      deleteDoc(doc(db, 'otps', cleanEmail)).catch(() => {});
    } catch (err) {}
  }
}

/**
 * Send an OTP code to a user's email via Brevo REST API
 */
export async function sendOtpViaBrevo({ email, name, otpCode, purpose = 'registration' }) {
  if (!isBrevoConfigured()) {
    console.warn('[otpService] Brevo is not configured yet. Set apiKey and senderEmail in brevoConfig.js.');
    return {
      success: false,
      needsConfig: true,
      error: 'Brevo API key is not configured yet in src/config/brevoConfig.js.',
    };
  }

  const cleanEmail = email.trim().toLowerCase();
  const displayName = (name || cleanEmail.split('@')[0] || 'Member').trim();

  const isPasswordReset = purpose === 'password_reset';
  const emailSubject = isPasswordReset
    ? `Your ALAGA Password Reset Code is ${otpCode}`
    : `Your ALAGA Verification Code is ${otpCode}`;

  const headerTitle = isPasswordReset ? 'Password Reset Verification' : 'Email Verification';
  const actionText = isPasswordReset
    ? 'We received a request to reset or update your ALAGA account password. Use the 6-digit confirmation code below to proceed:'
    : 'Use the 6-digit verification code below to confirm your registration in ALAGA:';

  const footerNotice = isPasswordReset
    ? 'This code is valid for <strong>15 minutes</strong>.<br>If you did not request this password reset, your account remains secure and you can safely ignore this email.'
    : 'This code is valid for <strong>15 minutes</strong>.<br>If you did not request this code, please ignore this email.';

  const payload = {
    sender: {
      name: brevoConfig.senderName || 'ALAGA Animal Care',
      email: brevoConfig.senderEmail.trim(),
    },
    to: [
      {
        email: cleanEmail,
        name: displayName,
      },
    ],
    subject: emailSubject,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${headerTitle}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F4F7F8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F4F7F8; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); border: 1px solid #E2ECF0;">
                <!-- Header Banner -->
                <tr>
                  <td style="background-color: #1A535C; padding: 26px 20px; text-align: center;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">ALAGA</h1>
                    <p style="color: #A9D6E5; margin: 4px 0 0 0; font-size: 13px;">Animal Welfare & Rescue Network</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 30px 24px; text-align: center;">
                    <h2 style="color: #1C2E25; margin: 0 0 10px 0; font-size: 20px;">${headerTitle}</h2>
                    <p style="color: #5C6F68; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
                      Hello <strong>${displayName}</strong>,<br>
                      ${actionText}
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background-color: #EDF7F2; border: 2px dashed #4ECDC4; border-radius: 12px; padding: 18px 24px; display: inline-block; margin: 0 auto 24px auto;">
                      <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1A535C; font-family: monospace;">${otpCode}</span>
                    </div>

                    <p style="color: #8C9F96; font-size: 12px; line-height: 1.4; margin: 0;">
                      ${footerNotice}
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #FAFCFD; padding: 16px 20px; text-align: center; border-top: 1px solid #E2ECF0;">
                    <p style="color: #A0B2AA; font-size: 11px; margin: 0;">
                      © ${new Date().getFullYear()} ALAGA App · Where every life deserves alaga
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoConfig.apiKey.trim(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || `Brevo returned status ${response.status}`;
      console.error('[otpService] Brevo API error:', errorMsg);
      return { success: false, error: errorMsg };
    }

    return { success: true, messageId: data?.messageId };
  } catch (err) {
    console.error('[otpService] Network error sending Brevo email:', err);
    return { success: false, error: err.message || 'Network error sending verification email.' };
  }
}

/**
 * Request an OTP to be sent for registration
 */
export async function requestRegistrationOtp(email, name) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_VALIDITY_MS;

  const record = {
    otp,
    expiresAt,
    attempts: 0,
    purpose: 'registration',
  };

  await saveOtpRecord(cleanEmail, record);

  const sendResult = await sendOtpViaBrevo({
    email: cleanEmail,
    name,
    otpCode: otp,
    purpose: 'registration',
  });

  if (sendResult.success) {
    return { success: true, sent: true };
  }

  console.warn(`[otpService] Brevo send failed (${sendResult.error}). Fallback OTP for ${cleanEmail}: ${otp}`);
  return {
    success: true,
    sent: false,
    needsConfig: true,
    fallbackOtp: otp,
    error: sendResult.error,
    message: sendResult.needsConfig
      ? 'Brevo is not configured yet. Paste your key in src/config/brevoConfig.js.'
      : `Brevo Notice: ${sendResult.error}`,
  };
}

/**
 * Request an OTP to be sent for password reset
 */
export async function requestPasswordResetOtp(email, name) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_VALIDITY_MS;

  const record = {
    otp,
    expiresAt,
    attempts: 0,
    purpose: 'password_reset',
  };

  await saveOtpRecord(cleanEmail, record);

  const sendResult = await sendOtpViaBrevo({
    email: cleanEmail,
    name,
    otpCode: otp,
    purpose: 'password_reset',
  });

  if (sendResult.success) {
    return { success: true, sent: true };
  }

  console.warn(`[otpService] Brevo send failed (${sendResult.error}). Fallback OTP for ${cleanEmail}: ${otp}`);
  return {
    success: true,
    sent: false,
    needsConfig: true,
    fallbackOtp: otp,
    error: sendResult.error,
    message: sendResult.needsConfig
      ? 'Brevo is not configured yet. Paste your key in src/config/brevoConfig.js.'
      : `Brevo Notice: ${sendResult.error}`,
  };
}

/**
 * Internal robust OTP verification across Memory, AsyncStorage, and Firestore
 */
async function verifyOtpInternal(email, enteredCode) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Email address is required for verification.' };
  }

  const record = await getOtpRecord(cleanEmail);

  if (!record) {
    return {
      success: false,
      error: 'No active verification code found for this email. Please tap "Resend Code" to request a new code.',
    };
  }

  if (Date.now() > record.expiresAt) {
    await clearOtpRecord(cleanEmail);
    return {
      success: false,
      error: 'Verification code has expired. Please request a new one.',
    };
  }

  if ((record.attempts || 0) >= 5) {
    await clearOtpRecord(cleanEmail);
    return {
      success: false,
      error: 'Too many incorrect attempts. Please request a new code.',
    };
  }

  const cleanEntered = (enteredCode || '').toString().replace(/[^0-9]/g, '').trim();
  const cleanStored = (record.otp || '').toString().replace(/[^0-9]/g, '').trim();

  if (!cleanEntered || cleanEntered.length !== 6 || cleanEntered !== cleanStored) {
    record.attempts = (record.attempts || 0) + 1;
    await saveOtpRecord(cleanEmail, record);
    const remaining = Math.max(0, 5 - record.attempts);
    return {
      success: false,
      error: `Incorrect verification code. Please check your email (${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} left).`,
    };
  }

  // Verification successful! Clean up OTP
  await clearOtpRecord(cleanEmail);
  return { success: true };
}

/**
 * Verify registration OTP
 */
export async function verifyRegistrationOtp(email, enteredCode) {
  return await verifyOtpInternal(email, enteredCode);
}

/**
 * Verify password reset OTP
 */
export async function verifyPasswordResetOtp(email, enteredCode) {
  return await verifyOtpInternal(email, enteredCode);
}
