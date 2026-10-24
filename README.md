# Wayfare 

A modern, fluid trip planning and turn-by-turn navigation mobile application built with **React Native**, **Expo SDK 58**, and **TypeScript**. Wayfare enables users to set up pickup and destination points, search real-world addresses via OpenStreetMap geocoding, pick coordinates visually on interactive maps, calculate live driving/riding/walking routes with realistic turn instructions, and track live trips.

---

##  Features

- **Authentication Flow**: Clean, responsive login interface with email and password client validation.
- **Location Search & Autocomplete**:
  - Live address search and debounced autocomplete powered by the OpenStreetMap Photon API.
  - Quick presets for popular spots and custom address fallback parsing.
- **Device GPS & Map Pin Picker**:
  - One-tap "Use current location" with automatic reverse geocoding via OpenStreetMap Nominatim.
  - Interactive "Pick on map" screen with real-time address resolution as the pin moves.
- **Dynamic Route Calculation**:
  - Real road network geometry and turn-by-turn directions using OSRM (Open Source Routing Machine).
  - Mode-specific speed and ETA estimates for **Drive** (car), **Ride** (two-wheeler), and **Walk** (pedestrian).
  - Resilient offline fallback geometry calculation.
- **Live In-App Navigation HUD & External Maps Integration**:
  - Live turn-by-turn guidance card with directional icons, step instructions, and remaining distances.
  - Device camera tracking and real-time location watching.
  - One-tap external launch to Google Maps / Apple Maps.
- **Modern Design & UI System**:
  - Refined typography, warm brand accents (`#F25A22`), cards, smooth transitions, and animated in-app toast feedback.

---

## Architecture & Project Structure

```text
wayfare_test/
├── assets/                  # App icons, splash screens, and static images
├── src/
│   ├── components/          # Reusable UI elements
│   │   ├── Button.tsx       # Primary & outline action buttons with loading indicators
│   │   ├── Input.tsx        # Styled text inputs with password visibility toggle & error states
│   │   ├── PlaceRow.tsx     # Location suggestion rows with iconography
│   │   └── RouteSummary.tsx # Connected pickup & drop-off route timeline card
│   ├── context/             # Global React Context providers
│   │   ├── AuthContext.tsx  # User authentication state
│   │   ├── ToastContext.tsx # Animated top toast alert notifications
│   │   └── TripContext.tsx  # Active pickup & drop-off trip management
│   ├── data/
│   │   └── mock.ts          # Default preset destinations & place types
│   ├── navigation/
│   │   └── AppNavigator.tsx # Native stack screen navigation definitions
│   ├── screens/
│   │   ├── LoginScreen.tsx        # Authentication screen
│   │   ├── SetLocationsScreen.tsx # Search, select, and swap pickup/drop-off
│   │   ├── TripReadyScreen.tsx    # Trip overview & confirmation before departure
│   │   ├── RouteViewScreen.tsx    # Interactive map, route polyline, and navigation HUD
│   │   └── MapPickerScreen.tsx    # Visual coordinate selector with reverse geocoding
│   ├── utils/
│   │   ├── geocoding.ts     # OpenStreetMap search & reverse geocoding utilities
│   │   ├── route.ts         # OSRM route calculations, travel times & steps
│   │   └── validation.ts    # Form field input validation regex & checks
│   └── theme.ts             # Centralized design tokens (colors, font sizes, radius, spacing)
├── App.tsx                  # Root component wrapping providers and navigation
├── app.json                 # Expo project configuration and native permissions
└── package.json             # Dependencies and build scripts
```

---

##  Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) app installed on your iOS or Android device (or an iOS Simulator / Android Emulator)

### Test Credentials

For quick evaluation and testing, you can use the following mock credentials (or any valid email format with at least a 6-character password):

- **Email**: `test@example.com`
- **Password**: `password123`

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd wayfare_test
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

4. **Run on your device**:
   - Scan the QR code in the terminal using the **Expo Go** app (Android) or the native **Camera** app (iOS).
   - Press `a` in the terminal to launch the Android Emulator.
   - Press `i` to launch the iOS Simulator.
   - Press `w` to open in a web browser.

---

## How to Generate Android APK

This project is configured with EAS Build (`preview` profile in [eas.json](file:///home/hp/Anjali/wayfare_test/eas.json) set to produce standalone `.apk` files).

### Method 1: Cloud Build via EAS (Recommended - No local Android SDK needed)

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   # or run with npx eas-cli@latest
   ```

2. **Log into your Expo account**:
   ```bash
   npx eas-cli@latest login
   ```

3. **Trigger the standalone APK build**:
   ```bash
   npx eas-cli@latest build -p android --profile preview
   ```
   *Once the cloud build finishes, EAS will output a direct download link to your installable `.apk` file.*

---

### Method 2: Local APK Build (Requires Android Studio & SDK)

If you have local Android build tools installed:

1. **Generate the native Android project**:
   ```bash
   npx expo prebuild --platform android
   ```

2. **Build the release APK with Gradle**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   *The generated APK will be available in:*
   `android/app/build/outputs/apk/release/app-release.apk`

---

## Verification & Quality Checks

Run TypeScript compiler check:
```bash
npx tsc --noEmit
```

Run Expo doctor diagnostics:
```bash
npx expo-doctor
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
