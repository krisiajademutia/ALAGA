import { brevoConfig, isBrevoConfigured } from '../config/brevoConfig';

// In-memory OTP storage: email -> { otp, expiresAt, attempts }
const otpStore = new Map();

/**
 * Generate a 6-digit numeric OTP code
 */
export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send an OTP code to a user's email via Brevo REST API
 */
export async function sendOtpViaBrevo({ email, name, otpCode }) {
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
    subject: `Your ALAGA Verification Code is ${otpCode}`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ALAGA Verification</title>
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
                    <h2 style="color: #1C2E25; margin: 0 0 10px 0; font-size: 20px;">Email Verification</h2>
                    <p style="color: #5C6F68; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
                      Hello <strong>${displayName}</strong>,<br>
                      Use the 6-digit verification code below to confirm your registration in ALAGA:
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background-color: #EDF7F2; border: 2px dashed #4ECDC4; border-radius: 12px; padding: 18px 24px; display: inline-block; margin: 0 auto 24px auto;">
                      <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1A535C; font-family: monospace;">${otpCode}</span>
                    </div>

                    <p style="color: #8C9F96; font-size: 12px; line-height: 1.4; margin: 0;">
                      This code is valid for <strong>10 minutes</strong>.<br>
                      If you did not request this code, please ignore this email.
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
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Save to in-memory store
  otpStore.set(cleanEmail, {
    otp,
    expiresAt,
    attempts: 0,
  });

  // Attempt to send via Brevo
  const sendResult = await sendOtpViaBrevo({
    email: cleanEmail,
    name,
    otpCode: otp,
  });

  if (sendResult.success) {
    return { success: true, sent: true };
  }

  // If Brevo fails (e.g., API key not enabled, rate limited, network error),
  // return fallback test OTP so developers/testers are not blocked from registering.
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
 * Verify the OTP entered by the user
 */
export function verifyRegistrationOtp(email, enteredCode) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const record = otpStore.get(cleanEmail);

  if (!record) {
    return { success: false, error: 'No verification code was requested for this email.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return { success: false, error: 'Verification code has expired. Please request a new one.' };
  }

  if (record.attempts >= 5) {
    otpStore.delete(cleanEmail);
    return { success: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  const cleanEntered = (enteredCode || '').trim();
  if (cleanEntered !== record.otp) {
    record.attempts += 1;
    return { success: false, error: 'Incorrect verification code. Please check your email.' };
  }

  // Verification successful! Clean up OTP
  otpStore.delete(cleanEmail);
  return { success: true };
}
