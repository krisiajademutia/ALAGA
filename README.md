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

## 🛠️ Technology Stack

| Layer | Technology | Specification / Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Mobile Framework** | [React Native](https://reactnative.dev/) | `v0.86.2` | Native cross-platform mobile compilation |
| **Runtime & Toolchain** | [Expo SDK](https://expo.dev/) | `v57.0.16` | Native device APIs, managed workflow & dev tooling |
| **UI Engine** | [React](https://react.dev/) | `v19.2.3` | Reactive components & concurrent state hooks |
| **Navigation** | [React Navigation](https://reactnavigation.org/) | `v7.x` | Native stacks, modal overlays & persistent tab bars |
| **Database & Auth** | [Google Firebase](https://firebase.google.com/) | `v12.19.0` | Cloud Firestore real-time NoSQL & Auth |
| **Email Verification** | [Brevo API v3](https://www.brevo.com/) | REST API | Transactional 6-digit email OTP dispatch |
| **Cloud Storage** | [ImgBB API](https://api.imgbb.com/) | REST API | Multi-part cloud image hosting for rescues & pets |
| **Hardware APIs** | `expo-location`, `expo-image-picker` | SDK 57 | Native GPS geocoding and camera/gallery picker |
| **Local Storage** | `@react-native-async-storage` | `v2.2.0` | Persistent session token & user preferences |
| **Animations** | `react-native-reanimated` | `v4.5.1` | Native thread micro-interactions and transitions |
| **Typography** | `@expo-google-fonts/plus-jakarta-sans` | `v0.4.2` | Clean, modern typography |
| **Iconography** | `@expo/vector-icons` (Ionicons) | `v15.1.1` | Vector iconography |

---

## 📁 Project Structure

```bash
ALAGA/
├── assets/                         # Application logos, mascots, and SVG icons
│   ├── alaga-logo.png
│   └── icons/                      # Decorative SVG sprinkle assets
├── src/
│   ├── components/                 # Reusable atomic UI components
│   │   ├── AlertModal.js           # Responsive custom blurred dialog modal
│   │   ├── AnimalCard.js           # Animal card with location & status badges
│   │   ├── Avatar.js               # User avatar circle with fallback initials
│   │   ├── Button.js               # Theme-styled accessible button variants
│   │   ├── EmptyState.js           # Illustrated empty state placeholders
│   │   ├── FloatingSprinkles.js    # Animated SVG sprinkles decoration
│   │   ├── Header.js               # Calibrated top bar with safe-area support
│   │   ├── InAppNotificationBanner.js # Animated slide-down push alert banner
│   │   ├── Input.js                # Form text input with focus & error states
│   │   ├── MapCard.js              # Native / web fallback location map view
│   │   ├── PhotoPickerModal.js     # Camera vs. Gallery bottom-sheet picker
│   │   ├── RescueCard.js           # Emergency rescue card with urgency pills
│   │   └── StatusPill.js           # Standardized status badge component
│   ├── config/                     # Configuration files
│   │   ├── firebaseConfig.js       # Firebase initialization & mock fallback
│   │   └── imgbbConfig.js          # ImgBB API keys & endpoint config
│   ├── constants/                  # Design tokens & theme definitions
│   │   └── theme.js                # COLORS, FONTS, SIZES, SHADOWS
│   ├── context/                    # Global reactive state management
│   │   └── AppContext.js           # Primary app state machine (Auth, Reports, Animals, Chat)
│   ├── data/                       # Initial datasets & taxonomy
│   │   └── mockData.js             # Initial seeds for breeds, species, & durations
│   ├── navigation/                 # Navigation routers & tab stacks
│   │   └── AppNavigator.js         # AuthStack, CommunityTabs, AdvocateTabs
│   ├── screens/                    # Application views organized by domain
│   │   ├── advocate/               # Advocate screens (Alerts, MyAnimals, AddAnimal, Requests)
│   │   ├── auth/                   # LoginScreen, RegisterScreen (Multi-step OTP)
│   │   ├── community/              # Community screens (HomeScreen, ReportRescueScreen)
│   │   ├── onboarding/             # Welcome, Splash, Onboarding carousel
│   │   └── shared/                 # Shared views (AnimalDetail, Chat, Donate, Activity, Notifications)
│   └── services/                   # Cloud Firestore & API service integrations
│       ├── animalService.js        # Animal catalog & request operations
│       ├── authService.js          # Authentication & user profile management
│       ├── chatService.js          # Firestore real-time messaging streams
│       ├── notificationService.js  # Real-time pub/sub notification dispatch
│       ├── otpService.js           # Brevo transactional email OTP service
│       ├── rescueService.js        # Emergency rescue report dispatch & status updates
│       └── storageService.js       # ImgBB multi-part cloud image upload service
├── App.js                          # Application entry point & font loader
├── app.json                        # Expo application manifest
├── firestore.rules                 # Cloud Firestore security rules
└── package.json                    # Project dependencies and npm scripts
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

## 🔒 Security & Data Integrity

- **Deterministic Firestore Document IDs:** Animal listings, rescue reports, and donation records use deterministic IDs combined with `setDoc(..., { merge: true })`, preventing synchronization conflicts across varying mobile connectivity.
- **Participant-Scoped Messaging:** Chat queries enforce security bounds (`where('participants', 'array-contains', currentUid)`), ensuring private peer-to-peer communication between responders and reporters.
- **Role-Based Guards:** Status transitions (such as claiming a rescue, approving applications, or verifying donations) verify that the authenticated user possesses the advocate role before persisting changes.
- **Secure Transactional OTPs:** 6-digit verification codes generated and verified server-side with strict 60-second request rate limiting.

---

<p align="center">
  <strong>ALAGA</strong> — <em>Where every life deserves alaga.</em>
</p>
