# Mafia Narrator

A Persian-language companion app for running in-person **Mafia** games. It helps the narrator prepare a scenario, distribute roles privately, and manage players during the game.

## Features

- **Preset scenarios** with configurable player counts and role requirements.
- **Custom games** with selectable roles and player names.
- **Saved scenarios and custom roles** stored locally on the device.
- **Blind role distribution** with shuffled cards.
- **Narrator dashboard** to track player status and warnings, reorder players, draw last-move cards, and use the timer.
- **Persian (RTL) interface** designed for mobile use.

## Tech stack

- React Native
- Expo
- TypeScript
- Zustand
- AsyncStorage for local persistence

## Getting started

### Requirements

- Node.js (use a current LTS release compatible with your installed Expo SDK)
- npm
- Expo Go for device testing, or an Android/iOS simulator

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm start
```

Then follow the Expo CLI instructions to open the app in Expo Go or a simulator.

Platform-specific commands:

```bash
npm run android
npm run ios
npm run web
```

## Project structure

```text
.
├── App.tsx                 # App flow and screen navigation
├── index.ts                # Expo entry point
├── app.json                # Expo app configuration
├── src/
│   ├── components/         # Screens and reusable UI components
│   ├── data/               # Preset scenarios, roles, and game cards
│   ├── store/               # Shared game state
│   └── types/              # TypeScript domain types
├── assets/                 # Images and card artwork
├── package.json
└── tsconfig.json
```

## How to use

1. Open the app and choose a game setup.
2. Select a preset scenario or create a custom game.
3. Set the player count and enter names if desired.
4. Distribute the shuffled role cards to players one at a time.
5. Use the narrator dashboard to track who is alive, manage warnings, and draw available last-move cards.
6. Reset the game when the session is finished.

Exact options depend on the selected scenario and the roles included in the project.

## Data and privacy

Saved custom scenarios and roles use device-local AsyncStorage. This repository does not document a cloud-sync service, so do not assume local data is synchronized between devices.

## Development checks

Before submitting changes, run:

```bash
npx tsc --noEmit
npx expo-doctor
```

Also test the main flows on the target platform: scenario selection, custom-game setup, role distribution, saved scenarios, and narrator controls.

## Contributing

Issues and pull requests are welcome. When reporting a bug, include the platform, steps to reproduce, expected behavior, and actual behavior.

## License

No license is currently specified in this repository. Unless a license is added, reuse and redistribution are not automatically granted.
