// ALAGA Brevo (Sendinblue) Transactional Email Configuration
// To prevent API keys from being leaked or revoked by GitHub Secret Scanner,
// your actual API key is loaded from src/config/brevoConfig.local.js (which is ignored by Git).

let localConfig = {};
try {
  localConfig = require('./brevoConfig.local').brevoConfig || {};
} catch (e) {
  localConfig = {};
}

export const brevoConfig = {
  // Loaded from untracked brevoConfig.local.js:
  apiKey: localConfig.apiKey || "",

  // The email address registered / verified as a Sender in your Brevo account:
  senderEmail: localConfig.senderEmail || "mutiakrisiaj@gmail.com",

  // The display name that appears in the user's Gmail inbox:
  senderName: localConfig.senderName || "ALAGA Animal Care",
};

export const isBrevoConfigured = () => {
  return Boolean(
    brevoConfig.apiKey &&
    brevoConfig.apiKey.startsWith("xkeysib-") &&
    brevoConfig.apiKey.length > 20 &&
    brevoConfig.senderEmail &&
    brevoConfig.senderEmail.includes("@")
  );
};
