// ALAGA Brevo (Sendinblue) Transactional Email Configuration
// To get your Brevo API Key:
// 1. Log in to https://app.brevo.com
// 2. Click your account name (top right) -> "SMTP & API" -> "API Keys" tab
// 3. Click "Generate a new API key", name it "ALAGA", and paste it below:

export const brevoConfig = {
  // Paste your Brevo API key here (starts with xkeysib-...)
  apiKey: "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",

  // The email address registered / verified as a Sender in your Brevo account
  senderEmail: "mutiakrisiaj@gmail.com",

  // The display name that appears in the user's Gmail inbox
  senderName: "ALAGA Animal Care",
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
