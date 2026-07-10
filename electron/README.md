# SafetyOS Electron Desktop App

This folder contains the Electron configuration for building a desktop application for SafetyOS.

## Structure

- **main.ts**: Main process that manages windows, spawns backend/frontend
- **preload.ts**: Preload script for secure IPC
- **package.json**: Electron-builder configuration with installer settings
- **tsconfig.json**: TypeScript configuration

## Building

### Prerequisites

- Python 3.11+ (for backend)
- Node.js 18+ (for frontend)
- npm or yarn

### Development

```bash
cd electron
npm install
npm start
```

This will:
1. Start the FastAPI backend on port 8000
2. Start the Next.js frontend on port 3000
3. Open the Electron window connecting to localhost:3000

### Production Build (.exe)

```bash
cd electron
npm install
npm run dist
```

Output: `electron/dist/SafetyOS Setup 1.0.0.exe`

The installer will:
- Install SafetyOS to Program Files
- Create a desktop shortcut
- Create Start Menu entries
- Configure Python environment automatically

## Notes

- In production, the backend and frontend are bundled with the app
- The Electron app starts backend/frontend automatically on app launch
- Environment variables are set automatically:
  - `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
  - `NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000`

## Icon

To use a custom icon, replace `assets/icon.ico` with a 256x256 ICO file.

See `create_icon.py` for Python script to generate icon from PNG.
