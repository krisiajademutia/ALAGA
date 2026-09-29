# ALAGA: Community-Driven Animal Rescue, Fostering, and Welfare Platform

<p align="center">
  <img src="assets/alaga-logo.png" alt="ALAGA Logo" width="180" />
</p>

<p align="center">
  <em>A modern, community-centered mobile platform connecting citizens reporting animals in distress with dedicated animal advocates, foster caregivers, and shelters.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.86.2-blue?logo=react&logoColor=white" alt="React Native 0.86.2" />
  <img src="https://img.shields.io/badge/Expo%20SDK-57-000020?logo=expo&logoColor=white" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/Firebase-Cloud%20Firestore%20v12-FFA611?logo=firebase&logoColor=white" alt="Firebase Firestore" />
  <img src="https://img.shields.io/badge/Email%20OTP-Brevo%20API%20v3-0B996F?logo=brevo&logoColor=white" alt="Brevo OTP" />
  <img src="https://img.shields.io/badge/Cloud%20Storage-ImgBB%20API-3B5998" alt="ImgBB API" />
  <img src="https://img.shields.io/badge/Branch-main-success?logo=git&logoColor=white" alt="Branch main" />
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-473018" alt="Platform Support" />
  <img src="https://img.shields.io/badge/License-ISC-92CDE5" alt="License ISC" />
</p>

---

## 📖 Overview

Across urban and rural communities in the Philippines, thousands of stray, abandoned, or injured animals require urgent medical assistance and sheltering. Traditional rescue workflows rely on fragmented, informal channels—such as viral social media posts and unorganized chat threads—leading to critical failures:

- **Missing or inaccurate location coordinates**, forcing rescuers to search blindly across streets.
- **Unassessed emergency severity**, leading to slow triage for critical medical cases.
- **Lost or buried rescue appeals**, leaving distressed animals without timely help.
- **Unverified donation appeals**, creating financial hesitation and accountability concerns.
- **Ambiguous pet locations**, hindering prospective adopters and foster caregivers from finding nearby animals.

**ALAGA** resolves these barriers through an integrated, mobile-first ecosystem. Powered by **React Native**, **Expo SDK 57**, and **Google Cloud Firestore**, ALAGA delivers real-time emergency dispatch with automated GPS reverse geocoding, multi-image evidence uploads via ImgBB, verifiable shelter/foster location tracking, structured pet adoption and foster screening, transparent donation verification, multi-factor OTP verification via Brevo, and direct in-app messaging.

---

---

## 🏗️ System Architecture

ALAGA is built following a decoupled, layered client-server architecture:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                            │
│  [Screen Navigators: AuthStack | CommunityTabs | AdvocateTabs | Modals] │
│  [Components: AnimalCard | RescueCard | StatusPill | AlertModal | Input]│
│  [Micro-Animations: FloatingSprinkles | Reanimated Transitions]         │
└────────────────────────────────────▲────────────────────────────────────┘
                                     │ User Actions & UI Events
┌────────────────────────────────────▼────────────────────────────────────┐
│                       BUSINESS LOGIC & STATE LAYER                      │
│     [AppContext State Machine: Auth, Reports, Animals, Chat, Dono]      │
│     [Domain Rules: Role Guards, Urgency Triage, Status Lifecycles]      │
└────────────────────────────────────▲────────────────────────────────────┘
                                     │ Data Sync & Native Invocations
┌────────────────────────────────────┴────────────────────────────────────┐
│                     NATIVE DEVICE HARDWARE SUBSYSTEMS                   │
│      [Expo Location (GPS)]  [Expo ImagePicker]  [Reanimated Engine]     │
└────────────────────────────────────▲────────────────────────────────────┘
                                     │ Real-Time Sync & HTTP Requests
┌────────────────────────────────────▼────────────────────────────────────┐
│                       PERSISTENCE & CLOUD LAYER                         │
│     [Google Firebase: Cloud Firestore v12 | Authentication]             │
│     [Brevo REST API v3: Transactional 6-Digit Email OTP]                │
│     [ImgBB REST API: Cloud Image & Receipt Hosting]                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your development machine:
- **Node.js**: `v18.0.0` or later
- **npm** or **yarn**
- **Git**
- **Expo Go App** (available on [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) or [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)) or an active Android/iOS emulator

### Installation & Launch

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/krisiajademutia/ALAGA.git
   cd ALAGA
   ```

2. **Verify You Are on the Main Branch:**
   ```bash
   git checkout main
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Start the Development Server:**
   ```bash
   npm start
   ```

5. **Run on Target Device:**
   - **Android Device / Emulator**: Press `a` in the terminal or scan the QR code using the **Expo Go** app.
   - **iOS Simulator**: Press `i` in the terminal.
   - **Web Browser**: Press `w` in the terminal.

---


---

<p align="center">
  <strong>ALAGA</strong> — <em>Where every life deserves alaga.</em>
</p>
