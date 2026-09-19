# ALAGA: Community-Driven Animal Rescue, Fostering, and Welfare Platform

<p align="center">
  <img src="assets/alaga-logo.png" alt="ALAGA Logo" width="180" />
</p>

<p align="center">
  <strong>Alert · Respond · Alaga</strong><br />
  <em>A modern, community-centered mobile platform connecting citizens reporting animals in distress with dedicated animal advocates and rescuers.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.86.2-blue?logo=react&logoColor=white" alt="React Native 0.86.2" />
  <img src="https://img.shields.io/badge/Expo%20SDK-57-000020?logo=expo&logoColor=white" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/Firebase-Cloud%20Firestore-FFA611?logo=firebase&logoColor=white" alt="Firebase Firestore" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-473018" alt="Platform Support" />
  <img src="https://img.shields.io/badge/License-ISC-92CDE5" alt="License ISC" />
</p>

---

## 📖 Overview

In urban and rural communities across the Philippines, thousands of stray, abandoned, or injured animals require urgent medical assistance and shelter. However, animal rescue operations have long relied on fragmented, informal methods—such as personal social media posts and unorganized chat groups. This leads to critical challenges:

- **Missing or inaccurate location coordinates**, forcing rescuers to search without guidance.
- **Unassessed emergency severity**, leading to slow triage for critical medical cases.
- **Lost or buried rescue appeals**, leaving distressed animals without timely help.
- **Unverified donation appeals**, creating financial hesitation and operational uncertainty.

**ALAGA** resolves these barriers through an integrated, mobile-first ecosystem. Powered by **React Native**, **Expo**, and **Google Cloud Firestore**, ALAGA delivers real-time emergency dispatch with automated GPS geocoding, multi-image evidence uploads, dynamic urgency scoring, pet adoption and foster lifecycle management, verified donation tracking, and direct in-app messaging.

---

## 🌟 Key Features

### 🚨 Real-Time Rescue Reporting & Dispatch
- **One-Tap GPS Capture**: Automatically retrieves device coordinates and translates them into human-readable addresses using `expo-location`.
- **Multi-Photo Evidence**: Supports batch photo selection (up to 8 images) with high-resolution preview and cloud hosting.
- **Dynamic Urgency Scoring**: Evaluates triage severity based on physical condition, vulnerability factors, and situational risks.
- **Status Progression**: Live status tracking (`Reported` ➔ `Responded` ➔ `Rescued` ➔ `Closed`) to prevent duplicate rescue attempts.
- **Interactive Spatial Map**: Visualizes open incidents geographically with filterable map pins.

### 🐾 Pet Profile & Adoption Lifecycle
- **Comprehensive Pet Profiles**: Captures breed, age, gender, weight, health/vaccination history, spay/neuter records, and behavioral traits.
- **Multi-Image Photo Carousel**: Interactive hero swipe gallery with page indicators and full-screen zoom preview modal.
- **Adoption & Foster Applications**: Community members submit formal applications with background questionnaires directly to the listing advocate.
- **One-Tap Status Transitions**: Real-time status toggle (`Available` ➔ `Currently Fostered` ➔ `Adopted`) with instant Firestore synchronization.

### 💬 Real-Time In-App Messaging & Notifications
- **Direct 1-on-1 Chat**: End-to-end synchronized messaging between adopters, reporters, and animal advocates powered by Firestore snapshot streams.
- **Unread Badge Counters**: Instant message badge increments and tab unread counts that decrement when conversations are opened.
- **Dual Alert Channels**: Combines high-priority local device push notifications with in-app notification center alerts.

### 🛡️ Role-Based Access Control (RBAC)
- **Community Supporters**: Report rescue incidents, browse pets, submit adoption/foster applications, and donate to verified cases.
- **Animal Advocates**: Claim and respond to rescue emergencies, publish and manage animal listings, review adoption applications, and audit donations.

### 🎁 Transparent Donation Verification
- **Case-Linked Financial Support**: Donors can sponsor specific rescue treatments or general shelter needs.
- **Verification Audit Trail**: Uploads GCash, Maya, or bank deposit reference numbers and screenshot receipts for advocate audit approval.

---

## 🎨 User Interface & Design System

ALAGA employs an **empathy-driven, accessible design system** tailored for readability in high-stress emergency environments and bright outdoor lighting:

- **Typography**: Clean, geometric typography powered by `@expo-google-fonts/plus-jakarta-sans` (`Regular`, `Medium`, `SemiBold`, `Bold`, `ExtraBold`).
- **Brand Palette**:
  - `Primary Sky Blue`: `#92CDE5` (Soothing, accessible primary accent)
  - `Primary Deep Teal`: `#2E7A99` (High-contrast interactive buttons & badges)
  - `Warm Background`: `#FCF8E8` (Soft, low-fatigue off-white canvas)
  - `Deep Warm Brown`: `#473018` (High-contrast typography adhering to WCAG AA)
  - `Secondary Sage`: `#B8D3C3` & `Pale Wash`: `#EBF4EF` (Calming status indicators)
- **De-Boxed Layouts**: Streamlined metadata bars and borderless profile cards that eliminate bulky containers and maximize screen breathing room.

<p align="center">
  <img src="assets/docs/Figure3_UI_Design.png" alt="ALAGA UI Design System" width="90%" />
</p>

---

## 🏗️ System Architecture

ALAGA is built following a decoupled, layered client-server architecture:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                            │
│  [Screen Navigators: AuthStack | CommunityTabs | AdvocateTabs | Modals] │
│  [Components: AnimalCard | RescueCard | SpecsBar | Avatar | ChatInput]  │
└────────────────────────────────────▲────────────────────────────────────┘
                                     │ User Interactions & Dispatched Events
┌────────────────────────────────────▼────────────────────────────────────┐
│                       BUSINESS LOGIC & STATE LAYER                      │
│     [AppContext State Machine: Auth, Reports, Animals, Chat, Dono]      │
│     [Domain Rules: Role Guards, Urgency Triage, Application Logic]      │
└────────────────────────────────────▲────────────────────────────────────┘
                                     │ Data Sync & Hardware Invocations
┌────────────────────────────────────┴────────────────────────────────────┐
│                     NATIVE DEVICE HARDWARE SUBSYSTEMS                   │
│      [Expo Location (GPS)]  [Expo ImagePicker]  [Reanimated Engine]     │
└────────────────────────────────────▲────────────────────────────────────┘
                                     │ Real-Time Sync & Offline Cache
┌────────────────────────────────────▼────────────────────────────────────┐
│                       PERSISTENCE & CLOUD LAYER                         │
│     [Google Firebase: Cloud Firestore | Auth | Cloud Storage | FCM]     │
│     [ImgBB Cloud Media Hosting API]                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram (Level 0)
<p align="center">
  <img src="assets/docs/Figure1_DFD_Level0.png" alt="Data Flow Diagram - Level 0" width="80%" />
</p>

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [React Native 0.86.2](https://reactnative.dev/) | Cross-platform native mobile compilation |
| **Runtime & Toolchain** | [Expo SDK 57](https://expo.dev/) | Native device APIs, compilation & dev tooling |
| **UI Library** | [React 19.2.3](https://react.dev/) | Component architecture, state hooks, concurrent rendering |
| **Navigation** | [React Navigation 7](https://reactnavigation.org/) | Native stack and persistent bottom tabs |
| **Database & Auth** | [Google Firebase v12](https://firebase.google.com/) | Cloud Firestore real-time NoSQL DB & Authentication |
| **Media Uploads** | [ImgBB API](https://api.imgbb.com/) | Cloud image storage for animal and rescue photos |
| **Hardware APIs** | `expo-location`, `expo-image-picker` | Native GPS geocoding and camera/gallery access |
| **Animations** | `react-native-reanimated`, `react-native-gesture-handler` | Physics-based micro-interactions |
| **Typography** | `@expo-google-fonts/plus-jakarta-sans` | Premium accessible typography |
| **Icons** | `@expo/vector-icons` (Ionicons) | Consistent vector iconography |

---

## 📁 Project Structure

```bash
ALAGA/
├── assets/                       # Image assets, app icons, and architecture diagrams
│   ├── alaga-logo.png
│   └── docs/                     # Architectural DFDs, ERDs, and UI design diagrams
├── src/
│   ├── components/               # Reusable atomic UI components
│   │   ├── AnimalCard.js         # Animal card with multi-photo count badge
│   │   ├── Avatar.js             # User avatar circle with initials/image
│   │   ├── Button.js             # Theme-styled accessible button variants
│   │   ├── Header.js             # Calibrated top bar with safe-area support
│   │   ├── Input.js              # Validated text inputs
│   │   └── RescueCard.js         # Emergency rescue card with urgency pills
│   ├── config/                   # Configuration files
│   │   ├── firebaseConfig.js     # Firebase connection & mock mode fallback
│   │   └── imgbbConfig.js        # Cloud photo upload configuration
│   ├── constants/                # Design tokens & color palettes
│   │   └── theme.js              # COLORS, FONTS, SIZES, SHADOWS
│   ├── context/                  # Global reactive state management
│   │   └── AppContext.js         # Primary app state machine (Auth, Reports, Animals, Chat)
│   ├── navigation/               # Navigation routers & tab stacks
│   │   └── AppNavigator.js       # AuthStack, CommunityTabs, AdvocateTabs
│   ├── screens/                  # Application views organized by domain
│   │   ├── advocate/             # Advocate-specific screens (Alerts, MyAnimals, AddAnimal)
│   │   ├── auth/                 # Sign In, Sign Up, Role Selection
│   │   ├── community/            # Community screens (Feed, ReportRescue, Donate)
│   │   ├── onboarding/           # Welcome, Splash, Onboarding carousel
│   │   └── shared/               # Shared views (AnimalDetail, Chat, Messages, Notifications)
│   └── services/                 # Cloud Firestore & native service integrations
│       ├── animalService.js      # Animal profiles & adoption application streams
│       ├── authService.js        # Authentication & profile management
│       ├── chatService.js        # Firestore real-time messaging & conversation streams
│       ├── notificationService.js# Device push & local notifications
│       └── rescueService.js      # Emergency rescue report dispatch & status updates
├── App.js                        # Application entry point & font loader
├── app.json                      # Expo application manifest
├── firestore.rules               # Cloud Firestore security rules
└── package.json                  # Dependencies and project scripts
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your development machine:
- **Node.js**: `v18.0.0` or later
- **npm** or **yarn**
- **Git**
- **Expo Go App** (available on [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) or [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)) or an Android/iOS emulator

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/krisiajademutia/ALAGA.git
   cd ALAGA
   ```

2. **Switch to the Backend Integration Branch:**
   ```bash
   git checkout alaga-with-backend
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Start the Metro Bundler:**
   ```bash
   npm start
   ```

5. **Run on Device or Emulator:**
   - **Android Device / Emulator**: Press `a` in the terminal or scan the QR code using the **Expo Go** app.
   - **iOS Simulator**: Press `i` in the terminal.
   - **Web Browser**: Press `w` in the terminal.

---

## 🔒 Security & Data Integrity

- **Deterministic Firestore Document IDs**: Animal listings and rescue reports use deterministic identifiers with `setDoc(..., { merge: true })`, preventing missing document synchronization errors across network latency.
- **Participant-Restricted Chat Rules**: In accordance with Firestore security rules, messaging queries are filtered by user UID (`where('participants', 'array-contains', currentUid)`), ensuring confidential peer-to-peer communication.
- **Role-Based Guards**: Protected mutations (such as marking an animal as adopted or advancing rescue stages) verify that the authenticated user is the assigned advocate before committing changes.

---

## 👥 Academic Attribution & Credits

- **Developer & Author:** Krisia Jade Mutia
- **Course Requirement:** CCE 106/L - Application Development & Emerging Technologies
- **Adviser / Course Instructor:** Maricel A. Timbal, MIT
- **Academic Term:** October 2025

---

<p align="center">
  <strong>ALAGA</strong> — <em>Because every life deserves care, compassion, and a loving home.</em>
</p>
