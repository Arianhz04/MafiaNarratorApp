# Mafia Narrator

A Persian-language companion app for running in-person **Mafia** games. Mafia Narrator helps a game narrator configure a session, distribute roles privately, and manage the game from a mobile-friendly, right-to-left interface.

> **Project:** Personal TypeScript application  
> **Author:** Arian Hasanzadeh  
> **Status:** In development

## Features

- **Preset scenarios** with player-count and role requirements.
- **Custom game setup** with player names and selectable roles.
- **Saved scenarios and custom roles** persisted locally on the device.
- **Shuffled role distribution** so players can view their roles privately, one at a time.
- **Narrator dashboard** for tracking player status and warnings, reordering players, drawing last-move cards, and using the timer.
- **Persian (RTL) interface** designed with mobile use in mind.

## Tech Stack

- **TypeScript**
- **React Native** and **Expo**
- **Zustand** for shared state
- **AsyncStorage** for local persistence

## Getting Started

### Prerequisites

- Node.js LTS compatible with the Expo SDK used by this project
- npm
- Expo Go, an Android/iOS simulator, or a suitable web environment

### 1. Clone the repository

```bash
git clone https://github.com/Arianhz04/MafiaNarratorApp.git
cd MafiaNarratorApp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm start
```

Follow the Expo CLI instructions to open the app on a device or simulator.

Platform-specific commands:

```bash
npm run android
npm run ios
npm run web
```

The availability and behavior of each target depend on the local development environment and the project's Expo configuration.

## How to Use

1. Open the app and choose a game setup.
2. Select a preset scenario or create a custom game.
3. Set the player count and enter player names as needed.
4. Distribute shuffled role cards privately, one player at a time.
5. Use the narrator dashboard to manage player status, warnings, turn order, last-move cards, and the timer.
6. Reset the game when the session is over.

Available roles and actions depend on the selected scenario and the content implemented in the app.

## Project Structure

```text
.
├── App.tsx
├── index.ts
├── app.json
├── src/
│   ├── components/   # Screens and reusable UI components
│   ├── data/         # Preset scenarios, roles, and game cards
│   ├── store/        # Shared game state
│   └── types/        # TypeScript domain types
├── assets/           # Images and card artwork
├── package.json
└── tsconfig.json
```

## Data and Privacy

Custom scenarios and roles are stored using device-local AsyncStorage. This README does not describe a cloud backend or account system; do not assume saved data synchronizes between devices. Avoid entering sensitive personal information into test data.

## Development Checks

Run these checks before submitting changes:

```bash
npx tsc --noEmit
npx expo-doctor
```

Also manually test the main flows on your target platform: scenario selection, custom-game setup, role distribution, saved scenarios, and narrator controls.

## Development Notes

This project was developed with AI-assisted tools as part of the implementation workflow. The repository is intended to document the actual application code and its behavior; contributors should review and understand changes before merging them.

## Future Improvements

Potential next steps include:

- Add automated tests for game setup and state transitions.
- Improve accessibility and test layouts on different screen sizes.
- Add screenshots or a short demo to document the user experience.
- Review persistence behavior and provide export/backup options if needed.

## Contributing

Bug reports and focused pull requests are welcome. Please include the platform, steps to reproduce, expected behavior, and actual behavior when reporting an issue.

## License

No license is currently specified. Unless a license is added, reuse and redistribution are not automatically granted.
