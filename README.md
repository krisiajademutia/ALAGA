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

## 🌟 Key Application Features

### 1. 🚨 Emergency Rescue Reporting & Geolocation
- **Real-Time GPS Reverse Geocoding:** Auto-detects device coordinates and resolves human-readable street addresses via `expo-location`.
- **Manual Landmark Fallback:** Allows reporters to describe nearby landmarks when GPS is unavailable.
- **Visual Condition & Urgency Triage:** Categorizes incidents (`Injured / Bleeding`, `Severe Malnutrition`, `Trapped / Abandoned`) with urgency ratings (`Low`, `Medium`, `High`, `Critical`).
- **Cloud Photo Uploads:** Directly uploads rescue photos to ImgBB cloud storage with progress indicators.
- **Incident State Lifecycle:** Automatically tracks incident progression:
  $$\text{Open} \longrightarrow \text{Responded} \longrightarrow \text{Rescued}$$

### 2. 🛡️ Advocate Command Suite & Incident Claiming
- **Nearby Rescue Alerts Feed:** Displays open incidents sorted by proximity with urgency badges.
- **One-Tap Case Claiming:** Advocates claim cases via *"Respond (I’ll help!)"* → assigns advocate identity and updates status to **`Responded`**.
- **Instant Chat Handshake:** Directly launches a communication thread with the reporter from the claimed alert dialog.
- **Rescue Finalization:** Marked safe by the responder via *"Mark Rescued"* → updates status to **`Rescued`**, closes the case, and increments advocate rescue metrics.
- **Real-Time Discussion Thread:** Public commenting on rescue incidents for coordination.

### 3. 🐾 Animal Catalog & Location Tracking
- **Comprehensive Listing Management:** Advocates publish pets with photo galleries, traits, vaccination/neutered status, and foster durations.
- **Shelter / Foster Location Input:** Dedicated location field (`City / Area`) with a one-tap **"Use Current GPS"** auto-detection button.
- **Linked Rescue Auto-Fill:** Automatically inherits and populates the verified location from a linked rescue case.
- **Location Visibility for Adopters:** Location pin icons and city labels are rendered directly on listing cards (`AnimalCard`) and profile views (`AnimalDetailScreen`).
- **State Machine Integration:**
  $$\text{Available} \longrightarrow \text{Being Fostered} \quad \text{or} \quad \text{Adopted}$$

### 4. 📋 Foster & Adoption Screening
- **Structured Applications:** Community members submit adoption or foster requests with personal introductions and commitment durations.
- **Advocate Triage & Decision:** Managing advocates review submissions:
  - **Approve Adoption:** Updates request status to **`Approved`** and animal profile to **`Adopted`**.
  - **Approve Foster:** Updates request status to **`Approved`** and animal profile to **`Being Fostered`**.
  - **Reject Request:** Updates request status to **`Rejected`** and notifies applicant.
- **Automated Handshake:** Approval automatically generates an introductory chat message between advocate and requester.

### 5. 💳 Transparent Monetary Donations & Verification
- **Multiple Payment Channels:** Supports GCash, Maya, Bank Transfer, and in-person cash sponsorship.
- **Proof Screenshot Upload:** Donors input transaction reference numbers and upload receipt screenshots via ImgBB.
- **Advocate Activity Hub Review:** Advocates inspect submitted receipts and perform one-tap verification:
  $$\text{Pending} \longrightarrow \text{Verified} \quad \text{or} \quad \text{Rejected}$$
- **Full-Screen Receipt Inspection:** High-resolution zoom preview of uploaded payment receipts.

### 6. 💬 Real-Time In-App Messaging
- **Direct 1-on-1 Chat:** Powered by Cloud Firestore real-time snapshot listeners (`chats/{convId}/messages`).
- **Linked Context Header:** Sticky banner displaying the referenced rescue case or animal profile.
- **Media Sharing:** Real-time photo messaging uploaded via ImgBB.
- **Timestamps & Sender Alignment:** Right/left conversational bubble alignment with live timestamps.

### 7. 🔐 Multi-Step Registration with Brevo Email OTP
- **Role-Based Onboarding:** Distinct registration paths for **Community Users** and **Animal Advocates** (with Organization affiliation).
- **6-Digit Transactional Email OTP:** Verified through the Brevo REST API v3 before account creation in Firebase.
- **60-Second Cooldown Timer:** Enforces security and prevents abuse on code resend requests.
- **Persistent Session:** Client-side token storage via `@react-native-async-storage/async-storage` (`@alaga_user_session`).

### 8. 📊 Activity Hub & Sub-Filter Carousels
- **Unified Activity Tracking:** Segmented dashboard for Rescue Reports, Adoption & Foster Requests, and Donation Receipts.
- **Dynamic Status Sub-Filters:** Filter records strictly by their exact status:
  - Reports: `All`, `Open`, `Responded`, `Rescued`
  - Requests: `All`, `Pending`, `Approved`, `Rejected`
  - Donations: `All`, `Pending`, `Verified`, `Rejected`
  - Animals: `All`, `Available`, `Being Fostered`, `Adopted`, `Under Care`

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
  <strong>ALAGA</strong> — <em>Where every life deserves alaga, compassion, and a safe home.</em>
</p>
