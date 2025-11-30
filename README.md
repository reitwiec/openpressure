# Open Pressure Sensing Device

Reitwiec Shandilya, Michelle Hui, Sebastian Bidegain, Joey Castillo (Cornell Tech). Carson Gundlach and Dr. David Otterburn (Weill Cornell Medicine)


A handheld, open-source instrument designed to measure tactile pressure thresholds digitally. Adapted from clinical tools like the AcroVal™ system, it applies calibrated pressure to the skin and records sensory responses for studies of nerve regeneration following reconstructive surgery.

This project supports the ongoing research of Dr. David Otterburn and Carson Gundlach at Weill Cornell Medicine, whose work in neurotization seeks to restore sensory nerve connections following breast reconstruction surgery. After mastectomy, patients often experience a loss of sensation that affects comfort, safety, and quality of life. Through surgical co-aptation of donor and recipient nerves, Dr. Otterburn’s team aims to re-establish sensory pathways; however, evaluating the success of that process has long relied on subjective or coarse analog tools.
Developed by Cornell Tech Master’s students Michelle Hui and Reitwiec Shandilya in the Cornell Tech MakerLab, this open-source device captures quantitative measurements of tactile pressure (in g/mm²). By precisely logging patient response data, it allows clinicians to objectively track sensory recovery over time, providing richer, reproducible data than traditional Semmes-Weinstein monofilaments, which only measure at discrete force intervals. Beyond reconstructive surgery, the same sensing tool could inform other clinical neurological testing and research functions, expanding open-source tools for quantifying sensation and nerve function.

The project is supported by the Cornell Tech MakerLab and is undertaken in partnership with the Open Source Hardware Association’s Open Healthware Initiative, with the support of the National Science Foundation. The goal is to create a validated, open-source alternative to proprietary devices such as the AcroVal™ Neurosensory & Motor Testing System, enabling wider adoption of transparent, reproducible clinical instrumentation across research and education.

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
