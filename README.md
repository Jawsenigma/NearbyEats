# NearbyEats

A React Native (Expo) app that shows your current location on a map and fetches nearby restaurants within a user-adjustable radius. Built with OpenStreetMap tiles and the Overpass API—no API keys required!

---

## 🗺️ Features

- **Current-location marker**: Pulsing Google-blue dot with white outline  
- **Nearby restaurants**: Pins for restaurants fetched via Overpass, labeled with their names  
- **Search bar**: Filter visible restaurants by name, with dropdown suggestions (up to 5)  
- **Adjustable radius**: Tap “Adjust radius” to reveal a translucent slider (0.5 – 5 miles); auto-hides after 4 s  
- **Safe‐area aware**: Layout respects notches and home indicators on iOS/Android  

---

## 🚀 Getting Started

### Prerequisites

- Node.js v14+  
- Yarn or npm  
- Expo CLI installed globally (optional):  
  ```bash
  npm install --global expo-cli
```

* Android Studio / Xcode (for emulators), or Expo Go on a real device

### Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/your-user/NearbyEats.git
   cd NearbyEats
   ```
2. **Install dependencies**

   ```bash
   yarn install
   # or
   npm install
   ```
3. **Start the development server**

   ```bash
   expo start
   ```
4. **Run on device / simulator**

   * Scan the QR code in Expo Go
   * Or press `i` (iOS simulator) / `a` (Android emulator)

---

## 📁 Project Structure

```
NearbyEats/
├─ app/                 # Expo Router screens
│  └─ (tabs)/
│     └─ index.tsx      # Main map & UI code
├─ hooks/
│  └─ useCurrentLocation.ts  # Custom hook for Expo Location
├─ assets/              # Images, icons, etc.
│  └─ marker-default.png
├─ app.json             # Expo configuration
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## 🔧 Configuration

No API keys needed—uses public Overpass endpoint and OpenStreetMap tiles. If you hit rate limits, consider:

* Caching results locally
* Self-hosting an Overpass instance
* Throttling/debouncing slider changes

---

## 📚 Dependencies

* [expo](https://expo.dev)
* [react-native-maps](https://github.com/react-native-maps/react-native-maps)
* [expo-location](https://docs.expo.dev/versions/latest/sdk/location/)
* [@react-native-community/slider](https://github.com/callstack/react-native-slider)
* [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)

---

## 🌟 License

This project is open-source under the [MIT License](LICENSE).

---

> Built with ❤️ by Tanmay Saxena

