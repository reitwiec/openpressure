# Pressure Monitor

A desktop application for medical pressure monitoring using a KB2040 microcontroller with HX711 load cell.

![Pressure Monitor](https://img.shields.io/badge/Platform-macOS-blue) ![Electron](https://img.shields.io/badge/Electron-31-green) ![React](https://img.shields.io/badge/React-18-blue)

## Features

- **Real-time pressure readings** via USB serial connection
- **Session management** - Create, view, and export patient sessions
- **5 readings per session** with ability to re-record any reading
- **Historical trend visualization** - Track pressure changes across sessions
- **Device calibration** - Built-in calibration workflow
- **CSV export** - Export sessions for external analysis
- **Offline operation** - All data stored locally

## Prerequisites

### Hardware
- KB2040 microcontroller (or compatible CircuitPython board)
- HX711 load cell amplifier
- Load cell sensor
- USB cable

### Software
- Node.js 18+ and npm
- macOS (for building the Mac app)

## Installation

### For Development

```bash
# Clone or copy the project
cd pressure-monitor

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Building for Distribution

```bash
# Build the Mac application
npm run build:mac

# The installer will be in the `release` folder
```

The build creates:
- `Pressure Monitor-1.0.0.dmg` - Drag-and-drop installer
- `Pressure Monitor-1.0.0-mac.zip` - Portable version

## Firmware Setup

Copy both files from the `firmware/` folder to your KB2040:

```
firmware/
├── code.py      # Main firmware (runs automatically)
└── hx711.py     # HX711 driver library
```

### Installation
1. Connect your KB2040 via USB
2. It should appear as a drive called `CIRCUITPY`
3. Copy `code.py` and `hx711.py` to the root of that drive
4. The device will automatically restart and begin running

### Pin Configuration (in code.py)
- `DT_PIN = board.GP5` - HX711 Data
- `SCK_PIN = board.GP6` - HX711 Clock  
- `BTN_PIN = board.GP16` - Button (uses internal pull-up)

## Usage

### 1. Connect the Device
1. Plug in the KB2040 via USB
2. Open Pressure Monitor
3. Select the serial port from the right panel
4. Click to connect

### 2. Calibration (First Time Setup)
1. Click "Calibrate" in the top bar
2. Long-press the device button (≥0.7 seconds) to start
3. Follow the on-screen steps:
   - Remove all load and press button
   - Place calibration mass and press button
4. Calibration is saved until device restart

### 3. Taking Readings
1. Create a new session (add optional notes)
2. Press the device button to take a reading
3. Click on an empty slot to save the reading
4. Repeat until all 5 slots are filled

### 4. Viewing History
1. Click "History" in the sidebar
2. View trend graph of average readings across sessions
3. Toggle between stress (g/mm²) and weight (g) views

### 5. Exporting Data
1. Select a session
2. Click "Export CSV" in the top bar
3. Choose save location

## Data Storage

All data is stored in `~/PressureReadings/`:
- `session_[timestamp].csv` - Reading data
- `session_[timestamp]_meta.json` - Session metadata

CSV format:
```csv
slot,timestamp,grams,stress_g_mm2
1,2025-01-15T14:30:05,45.2,117.5
2,2025-01-15T14:30:45,44.8,116.4
...
```

## Configuration

Settings are available in the connection panel:
- **Wire Diameter (mm)** - Used for stress calculation
- **Calibration Mass (g)** - Reference mass for calibration

## Troubleshooting

### Device not showing up
- Ensure the KB2040 is properly connected
- Try a different USB cable
- Check if CircuitPython is running (should show as a serial device)

### Readings not appearing
- Verify the serial connection is established (green indicator)
- Check the Device Log for error messages
- Ensure the firmware is running correctly

### Calibration issues
- Make sure to remove ALL load during tare
- Use a precise calibration mass
- Keep the sensor stable during calibration

## License

MIT License - See LICENSE file for details.
