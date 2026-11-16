# ApisGuard — Smart IoT Single-Hive Monitoring & Control System
## Mobile-First Black UI Specification (4-Page App + GPS + 2D Thermal Heat Map)

---

## 1. Project Overview & Scope

**ApisGuard** is a clean, **black and simple mobile-first dashboard** designed for monitoring and controlling a single smart beehive across **4 categorized pages** (`Overview`, `Controls`, `Charts`, `Logs`) using a sticky top bar and a mobile bottom navigation bar.

### Core Capabilities
1. **Hive Climate & 3-Level Thermal Probes**: Hive temperature and humidity (`DHT22`), plus **3 vertical waterproof temperature probes (`Top`, `Middle`, `Bottom` via `DS18B20`)** feeding a **2D Hive Heat Map**.
2. **Honey Flow, 5 kg Weight Scale & Harvest Time**: Real-time hive weight (`HX711 + 5kg Load Cell`) with daily gain/loss tracking, **harvest-ready threshold** detection (`>= 4.20 kg`), and rapid weight-loss detection (`>= 0.50 kg`).
3. **Bee Traffic Counter (`2x IR Sensors`)**: Dual infrared sensors at the entrance to count bees **entering** and **exiting** the hive.
4. **Theft & Fall Detection (`MPU6050`)**: Real-time tilt/motion monitoring to detect suspicious tampering/theft or physical hive falls.
5. **GPS Anti-Theft Tracking (`NEO-6M` + Google Maps)**: Real-time GPS location pinned at the top of the **Overview** page with a configurable geofence (default `50 m`).
6. **Battery Capacity Monitoring (`INA219`)**: Real-time battery voltage (`V`), current draw (`mA`), and remaining capacity (`%`) via I2C current/voltage sensing.
7. **Interactive Actuator Remote Control**: Dedicated **Controls** page for:
   * **Entrance Gate Servo**: 3 preset positions (`OPEN`, `GUARD_MODE`, `CLOSED`).
   * **Sugar Syrup Dispenser (`Type 3 Ultra-Quiet Submersible Water Pump`)**: Automatically dispenses sugar syrup if honey stores drop drastically or the hive lacks stores, with a manual dispense trigger on the dashboard.
8. **24-Hour Historical Charts & 2D Heat Map**: Dedicated **Charts** page with **Temp & Humidity** (`DHT22`), **2D Heat Map** (live 3-level vertical profile + 24h Top/Mid/Bot matrix), and **Weight Flow**.

---

## 2. Black & Simple Multi-Page Layout (Desktop & Mobile)

* **Theme & Icons**: Pure black/zinc dark UI (`#000000` / `#09090b`) with `@iconify/react` icons (no emojis).
* **Navigation**: Sticky top bar (`Overview`, `Controls`, `Charts`, `Logs`, battery %, Wi-Fi RSSI, alerts) on desktop + fixed 4-tab bottom navigation bar on mobile (`< 768px`).
* **Page 1 — Overview (`/`)**: Active `AlertBanner`, `HiveGoogleMap` at the top, 4 live sensor KPI cards (2×2 mobile / 4-col desktop), and 3 quick-status tiles.
* **Page 2 — Controls (`/controls`)**: `GateButtons` and `SyrupControl`.
* **Page 3 — Charts (`/charts`)**: 24h summary cards (3-level probe spread, brood temp range, weight range) + tabbed `Temp & Humidity`, `2D Heat Map`, and `Weight Flow`.
* **Page 4 — Logs (`/logs`)**: Active alerts + filterable `ActivityLogModal` (`all`, `actuator`, `alert`, `system`).

```
+---------------------------------------------------------------------------------------------+
| STICKY TOP NAVBAR (Black UI, Iconify Icons, No Emojis)                                      |
| ApisGuard [Online] | [Overview] [Controls] [Charts] [Logs]              | Bat: 94% | -65dBm |
+---------------------------------------------------------------------------------------------+
| PAGE: / (OVERVIEW)                                                                          |
| [!] ALERT: Brood temp reached 36.2°C — High temperature warning                 [Dismiss]   |
| +-----------------------------------------------------------------------------------------+ |
| | LIVE GPS & ANTI-THEFT (Top of Overview)         Geofence: [Safe - Within 50m Zone]      | |
| | [ Interactive Google Maps View ]                GPS: 6.9271° N, 79.8612° E              | |
| +-----------------------------------------------------------------------------------------+ |
| +-------------------+ +-------------------+ +-------------------+ +-----------------------+ |
| | Hive Climate(DHT22| | Hive Weight (5kg) | | Bee Traffic (2xIR)| | Motion (MPU6050)      | |
| | 34.8 °C / 58%     | | 3.85 kg (+0.24)   | | In: 142 / Out:136 | | Stable (0.4° tilt)    | |
| +-------------------+ +-------------------+ +-------------------+ +-----------------------+ |
| [Entrance Gate: OPEN]   [Sugar Syrup: Standby (Auto ON)]   [24h Trends: View Charts]        |
+---------------------------------------------------------------------------------------------+
| MOBILE BOTTOM NAV (<768px):  [ Overview ]   [ Controls ]   [ Charts ]   [ Logs ]            |
+---------------------------------------------------------------------------------------------+
```

---

## 3. Hardware & Sensor Specifications (Including GPS)

### 3.1 Hardware Components (BOM)

| Component | Model | Purpose | Voltage |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32 DevKit | Wi-Fi, MQTT client, sensor sampling & PWM | 3.3V (5V USB) |
| **Temp & Humidity** | DHT22 | Hive temperature & humidity monitoring | 3.3V |
| **3-Level Thermal Probes** | 3x DS18B20 Waterproof (Top/Mid/Bot) | 2D hive vertical heat map | 3.3V (1-Wire bus) |
| **Bee Traffic Counter** | 2x IR Sensors | Count bees entering & exiting the hive | 3.3V – 5V |
| **Theft & Fall Sensor** | MPU6050 (6-axis IMU) | Hive tilt, fall, and theft/tamper detection | 3.3V (I2C) |
| **GPS Module** | NEO-6M / U-Blox GPS | Real-time latitude, longitude & Google Maps geofence | 3.3V – 5V (UART) |
| **Weight Scale** | 5kg Load Cell + HX711 | Hive weight, rapid loss & honey harvesting time | 3.3V – 5V |
| **Battery Monitor** | INA219 Current/Voltage Sensor | Battery voltage, current (`mA`) & capacity (`%`) | 3.3V (I2C) |
| **Entrance Gate** | Servo Motor (`MG996R` / Servo) | Open and close hive entrance gate | 5V |
| **Sugar Syrup Dispenser** | Type 3 Ultra-Quiet Submersible Water Pump + MOSFET/Relay | Automated & manual emergency syrup feeding | 5V |

### 3.2 ESP32 GPIO Pinout Table

| ESP32 Pin | Peripheral | Interface | Description |
| :--- | :--- | :--- | :--- |
| **GPIO 16 (RX2)** | NEO-6M GPS Module (TX) | Hardware UART2 | Receives NMEA GPS sentences (Lat / Lng) |
| **GPIO 17 (TX2)** | NEO-6M GPS Module (RX) | Hardware UART2 | GPS configuration commands |
| **GPIO 21** | MPU6050 & INA219 | Shared I2C (SDA) | Motion/theft IMU + battery current/voltage sensor |
| **GPIO 22** | MPU6050 & INA219 | Shared I2C (SCL) | Shared I2C clock bus |
| **GPIO 4** | DHT22 Sensor | 1-Wire Digital | Hive temperature & humidity |
| **GPIO 13** | 3x DS18B20 Probes (Top/Mid/Bot) | 1-Wire Digital (4.7k pull-up) | 3-level hive temperature readings for 2D heat map |
| **GPIO 18** | HX711 Load Cell Amp | Digital Output (SCK) | 5kg scale clock pin |
| **GPIO 19** | HX711 Load Cell Amp | Digital Input (DT) | 5kg scale 24-bit data stream |
| **GPIO 32** | IR Sensor 1 (Outer) | Digital Input | Bee entrance/exit direction sensing |
| **GPIO 33** | IR Sensor 2 (Inner) | Digital Input | Bee entrance/exit direction sensing |
| **GPIO 27** | Entrance Gate Servo | PWM Output | Controls gate servo angle (`OPEN`, `GUARD_MODE`, `CLOSED`) |
| **GPIO 23** | Type 3 Submersible Pump MOSFET/Relay | Digital Output | Controls sugar syrup water pump |

---

## 4. Simplified MQTT Topics & GPS Payloads

### 4.1 Topic Endpoints

| Topic | Publisher | Subscriber | Purpose |
| :--- | :--- | :--- | :--- |
| `apisguard/telemetry` | ESP32 | Backend | Combined sensor, GPS, and device metrics |
| `apisguard/status` | ESP32 | Backend | Heartbeat, battery voltage, Wi-Fi RSSI |
| `apisguard/actuators/set` | Web App $\rightarrow$ Backend | ESP32 | Control entrance gate servo or Type 3 syrup pump |
| `apisguard/actuators/ack` | ESP32 | Backend $\rightarrow$ Web | Actuator state confirmation |
| `apisguard/alerts` | ESP32 / Backend | Web Dashboard | Immediate notifications (Geofence breach, Overheat) |

---

### 4.2 Telemetry Payload with GPS (`apisguard/telemetry`)

```json
{
  "timestamp": 1794762000,
  "metrics": {
    "temperature": 34.8,
    "humidity": 58.2,
    "thermalProbes": {
      "top": 35.6,
      "middle": 34.9,
      "bottom": 33.2
    },
    "weightKg": 3.85,
    "beesIn": 142,
    "beesOut": 136,
    "motion": {
      "tiltDeg": 0.4,
      "theftAlert": false,
      "fallDetected": false
    }
  },
  "location": {
    "latitude": 6.927079,
    "longitude": 79.861244,
    "altitudeMeters": 14.5,
    "satellites": 9,
    "isGeofenceSafe": true
  },
  "device": {
    "batteryPct": 92,
    "batteryVoltage": 12.42,
    "batteryCurrentMa": 215,
    "wifiRssi": -65
  }
}
```

#### Actuator Command Payload (`apisguard/actuators/set`)
```json
{
  "commandId": "cmd-2041",
  "timestamp": 1794762010,
  "actions": {
    "entranceGate": {
      "position": "GUARD_MODE",
      "angle": 45
    },
    "syrupDispenser": {
      "dispense": false,
      "durationSec": 5,
      "mode": "AUTO"
    }
  }
}
```

---

## 5. MySQL Database Schema (with GPS & Single Hive)

```sql
CREATE DATABASE IF NOT EXISTS apisguard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE apisguard;

-- 1. Beekeeper Profile
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Time-Series Telemetry (Sensors + GPS + Health)
CREATE TABLE telemetry (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    temperature DECIMAL(4, 2),       -- DHT22 temperature (°C)
    humidity DECIMAL(4, 2),          -- DHT22 relative humidity (%)
    temp_top DECIMAL(4, 2),          -- Upper DS18B20 probe temp (°C)
    temp_middle DECIMAL(4, 2),       -- Middle DS18B20 probe temp (°C)
    temp_bottom DECIMAL(4, 2),       -- Lower DS18B20 probe temp (°C)
    weight_kg DECIMAL(6, 2),         -- HX711 + 5kg load cell weight (kg)
    bees_in INT,                     -- IR sensor entering count
    bees_out INT,                    -- IR sensor exiting count
    tilt_deg DECIMAL(5, 2),          -- MPU6050 tilt angle (°)
    theft_alert BOOLEAN DEFAULT FALSE,
    fall_detected BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10, 8),         -- NEO-6M GPS Latitude
    longitude DECIMAL(11, 8),        -- NEO-6M GPS Longitude
    altitude_meters DECIMAL(6, 2),   -- NEO-6M GPS Altitude
    satellites_connected INT,        -- GPS Fix quality
    battery_pct INT,                 -- INA219 battery percentage (0 - 100%)
    battery_voltage DECIMAL(5, 2),   -- INA219 battery voltage (V)
    battery_current_ma DECIMAL(7, 2),-- INA219 current draw (mA)
    wifi_rssi INT,                   -- Signal strength (dBm)
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recorded_at (recorded_at DESC)
);

-- 3. Actuator States & Settings
CREATE TABLE actuators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('entrance_gate', 'syrup_dispenser') NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    current_state VARCHAR(50) DEFAULT 'OFF',
    is_auto_mode BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default actuators
INSERT INTO actuators (type, name, current_state, is_auto_mode) VALUES
('entrance_gate', 'Entrance Gate Servo', 'OPEN', FALSE),
('syrup_dispenser', 'Type 3 Sugar Syrup Pump', 'OFF', TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- 4. Actuator Command History Log
CREATE TABLE actuator_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actuator_type ENUM('entrance_gate', 'syrup_dispenser') NOT NULL,
    triggered_by ENUM('manual_web', 'auto_rule') NOT NULL,
    command_details VARCHAR(255) NOT NULL,
    status ENUM('sent', 'acknowledged', 'failed') DEFAULT 'sent',
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Incidents and Alerts Table
CREATE TABLE alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_type ENUM('HIGH_TEMP', 'LOW_TEMP', 'THEFT_TAMPER', 'HIVE_FALL', 'RAPID_WEIGHT_LOSS', 'HARVEST_READY', 'GEOFENCE_BREACH', 'LOW_BATTERY') NOT NULL,
    severity ENUM('info', 'warning', 'critical') DEFAULT 'warning',
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Hive Base Settings & Geofence Coordinates
CREATE TABLE settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed initial GPS Home location and thresholds
INSERT INTO settings (setting_key, setting_value) VALUES
('home_latitude', '6.927079'),
('home_longitude', '79.861244'),
('geofence_radius_meters', '50'),
('max_temp_threshold', '36.00'),
('rapid_weight_loss_kg', '0.50'),
('harvest_weight_kg', '4.20'),
('scale_tare_offset', '0.00')
ON DUPLICATE KEY UPDATE setting_key=setting_key;
```

---

## 6. Dockerized Stack on AWS Ubuntu

Everything is deployed together using Docker Compose.

### `docker-compose.yml`
```yaml
version: '3.8'

services:
  # 1. MySQL 8 Database
  mysql:
    image: mysql:8.0
    container_name: apisguard-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: my_secure_root_password
      MYSQL_DATABASE: apisguard
      MYSQL_USER: apisguard_user
      MYSQL_PASSWORD: apisguard_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "127.0.0.1:3306:3306"
    networks:
      - apisguard-net

  # 2. Mosquitto MQTT Broker
  mosquitto:
    image: eclipse-mosquitto:2.0
    container_name: apisguard-mosquitto
    restart: always
    ports:
      - "1883:1883"   # Standard MQTT for ESP32
      - "9001:9001"   # WebSocket MQTT
    volumes:
      - ./mosquitto/config/mosquitto.conf:/mosquitto/config/mosquitto.conf
      - mosquitto_data:/mosquitto/data
    networks:
      - apisguard-net

  # 3. Node.js Backend API
  backend:
    build: ./backend
    container_name: apisguard-backend
    restart: always
    environment:
      PORT: 5000
      DB_HOST: mysql
      DB_USER: apisguard_user
      DB_PASSWORD: apisguard_password
      DB_NAME: apisguard
      MQTT_URL: mqtt://mosquitto:1883
    ports:
      - "5000:5000"
    depends_on:
      - mysql
      - mosquitto
    networks:
      - apisguard-net

volumes:
  mysql_data:
  mosquitto_data:

networks:
  apisguard-net:
    driver: bridge
```

---

## 7. Single-Page React Project File Structure

Built using **Vite + React + TypeScript + Tailwind CSS**, **Iconify** (`@iconify/react` via the [Iconify API](https://iconify.design/docs/api/) — no emojis in UI), and Google Maps (`@react-google-maps/api` or `@vis.gl/react-google-maps`).

```text
frontend/
├── public/
│   ├── favicon.ico
│   ├── manifest.json              # PWA support for mobile install
│   └── bee-icon.png
├── src/
│   ├── assets/
│   │   ├── bee-marker.png         # Custom hive map marker icon
│   │   └── bee-logo.svg
│   ├── components/
│   │   ├── Navbar.tsx             # Sticky top navbar: section jump links, status, battery %, Wi-Fi RSSI
│   │   ├── AlertBanner.tsx        # High-visibility banner for critical alerts
│   │   ├── MetricCardsGrid.tsx    # Responsive grid of live sensor values
│   │   │   ├── MetricCard.tsx     # Reusable card with progress/range indicator
│   │   │   ├── BroodTempCard.tsx  # DHT22 hive temperature & humidity
│   │   │   ├── WeightCard.tsx     # 5kg HX711 scale + harvest-ready status
│   │   │   ├── BeeTrafficCard.tsx # 2x IR sensors (bees entering / exiting)
│   │   │   └── MotionSecurityCard.tsx # MPU6050 tilt, fall & theft guard
│   │   ├── ActuatorControlPanel.tsx# Remote control module
│   │   │   ├── GateButtons.tsx    # 3-state buttons (Open, Guard, Closed)
│   │   │   └── SyrupControl.tsx   # Type 3 pump manual dispense + Auto-feed toggle
│   │   ├── HiveGoogleMap.tsx      # Google Maps component
│   │   │   ├── MapContainer.tsx   # Interactive map with satellite toggle
│   │   │   ├── HiveMarker.tsx     # Custom pin showing live coordinates
│   │   │   └── GeofenceCircle.tsx # Visual safe radius boundary circle
│   │   ├── AnalyticsCharts.tsx    # 24-hour trends & 2D thermal heat map tabs
│   │   │   ├── WeightAreaChart.tsx# Honey yield and weight curves
│   │   │   ├── ClimateLineChart.tsx# Dual-axis temperature & humidity trends
│   │   │   └── HiveHeatMap2D.tsx  # 3-level (Top/Mid/Bot) 2D hive heat map
│   │   └── ActivityLogModal.tsx   # Filterable list of recent alerts & triggers
│   ├── pages/
│   │   ├── OverviewPage.tsx       # `/` — Alerts, HiveGoogleMap, KPI cards, quick status
│   │   ├── ControlsPage.tsx       # `/controls` — Gate Servo & Type 3 Syrup Pump
│   │   ├── ChartsPage.tsx         # `/charts` — 24h Temp/Humidity, 2D Heat Map, Weight
│   │   └── LogsPage.tsx           # `/logs` — Active alerts & incident/actuator log
│   ├── hooks/
│   │   ├── useLiveTelemetry.ts    # Listens to WebSocket live updates
│   │   ├── useActuatorControl.ts  # Sends commands to backend & tracks confirmation
│   │   └── useHistoricalData.ts   # Fetches 24-hour sensor data for charts
│   ├── services/
│   │   ├── api.ts                 # Axios HTTP client
│   │   └── socket.ts              # Socket.io connection manager
│   ├── types/
│   │   ├── telemetry.ts           # Sensor, GPS, and device status types
│   │   └── actuator.ts            # Command and state types
│   ├── utils/
│   │   ├── geofence.ts            # Haversine distance calculator for anti-theft
│   │   └── formatters.ts          # Units (°C, kg, dB, Lat/Lng)
│   ├── App.tsx                    # The Single-Page Dashboard assembly
│   ├── main.tsx                   # React root entry
│   └── index.css                  # Tailwind styles
├── .env.example                   # VITE_GOOGLE_MAPS_API_KEY=your_key_here
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 8. Google Maps Integration Component (`HiveGoogleMap.tsx`)

The map component visually displays the hive's GPS coordinates, shows whether the hive is inside its safe geofence radius, and supports full mobile panning and zooming:

```tsx
import React, { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import { Icon } from '@iconify/react';

interface HiveLocationProps {
  latitude: number;
  longitude: number;
  homeLat: number;
  homeLng: number;
  geofenceRadiusMeters: number;
  isGeofenceSafe: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '320px',
  borderRadius: '0.75rem',
};

export const HiveGoogleMap: React.FC<HiveLocationProps> = ({
  latitude,
  longitude,
  homeLat,
  homeLng,
  geofenceRadiusMeters,
  isGeofenceSafe,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const center = useMemo(() => ({ lat: latitude, lng: longitude }), [latitude, longitude]);
  const homeCenter = useMemo(() => ({ lat: homeLat, lng: homeLng }), [homeLat, homeLng]);

  if (loadError) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
        Error loading Google Maps. Check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-80 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400">
        Loading Hive GPS Map...
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Icon icon="lucide:navigation" className="w-4 h-4 text-amber-500" />
            Live GPS & Anti-Theft Tracking
          </h3>
          <p className="text-xs text-slate-500">
            {Math.abs(latitude).toFixed(6)}° {latitude >= 0 ? 'N' : 'S'},{' '}
            {Math.abs(longitude).toFixed(6)}° {longitude >= 0 ? 'E' : 'W'}
          </p>
        </div>

        {/* Geofence Status Badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            isGeofenceSafe
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200 animate-bounce'
          }`}
        >
          {isGeofenceSafe ? (
            <>
              <Icon icon="lucide:shield-check" className="w-3.5 h-3.5 text-emerald-600" />
              Inside Safe Zone
            </>
          ) : (
            <>
              <Icon icon="lucide:shield-alert" className="w-3.5 h-3.5 text-rose-600" />
              GEOFENCE BREACH!
            </>
          )}
        </span>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={16}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {/* Hive Live Marker */}
        <Marker position={center} title="ApisGuard Hive 01" />

        {/* Geofence Safe Radius Circle around Home Base */}
        <Circle
          center={homeCenter}
          radius={geofenceRadiusMeters}
          options={{
            fillColor: isGeofenceSafe ? '#10B981' : '#EF4444',
            fillOpacity: 0.15,
            strokeColor: isGeofenceSafe ? '#059669' : '#DC2626',
            strokeWeight: 2,
          }}
        />
      </GoogleMap>
    </div>
  );
};
```

---

## 9. Next Steps to Build ApisGuard

1. **Frontend**: Scaffold the single-page React app with Tailwind CSS and the components shown above.
2. **Backend**: Implement the Express + MQTT subscriber service with WebSocket push and automated trigger rules (high-temperature alert, geofence breach, rapid weight-loss syrup dispense).
3. **Firmware**: Program the ESP32 to read sensors, extract GPS sentences from the NEO-6M, transmit MQTT telemetry, and handle actuator commands.
