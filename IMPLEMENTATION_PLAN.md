# ApisGuard — Step-by-Step Implementation Plan

This plan breaks the [APISGUARD_SPECIFICATION.md](./APISGUARD_SPECIFICATION.md) build into sequential, testable phases—from local infrastructure and backend services to the single-page React UI, ESP32 firmware, and end-to-end verification.

## Scope

- **In**: Single-hive, black & simple mobile-first dashboard (`Vite + React + TypeScript + Tailwind CSS` + `react-router-dom`), Iconify icons (`@iconify/react`, no emojis), Google Maps GPS + geofencing, `Node.js/Express` + `Socket.io` backend, `Mosquitto` MQTT broker, `MySQL 8` via Docker Compose, and `ESP32` sensor/actuator firmware (entrance gate servo and Type 3 sugar syrup pump).
- **Out**: Multi-hive fleet management, multi-page navigation, and unrelated authentication/billing features not defined in the specification.

---

## Phase 0: AWS EC2 Ubuntu Server & Docker Setup

**Goal**: Provision an AWS Ubuntu cloud server, open only the required firewall ports, and install Docker + Docker Compose.

- [ ] **0.1** **Launch AWS EC2 Instance**:
  - Open **AWS Console -> EC2 -> Launch Instance**.
  - Name: `apisguard-server`
  - AMI: **Ubuntu Server 24.04 LTS** (or 22.04 LTS, 64-bit x86).
  - Instance type: `t3.small` (2 vCPU, 2 GB RAM recommended for MySQL 8 + Mosquitto + Node.js) or `t3.micro` with a 2 GB swap file.
  - Storage: `20 GB gp3` EBS volume.
  - Key pair: Create and download `apisguard-key.pem` (keep permissions `chmod 400 apisguard-key.pem`).
  - Allocate and associate an **Elastic IP** so the public IP used by your ESP32 never changes on reboot.
- [ ] **0.2** **Configure EC2 Security Group (Inbound Rules)**:
  - `22` (SSH): **My IP** only
  - `80` (HTTP) & `443` (HTTPS): `0.0.0.0/0` (web dashboard access)
  - `5000` (Node.js Backend / Socket.io): `0.0.0.0/0` (can be closed later if proxied through Nginx on `80`/`443`)
  - `1883` (MQTT TCP for ESP32): `0.0.0.0/0` (secure with Mosquitto username/password in Phase 1)
  - Keep `3306` (MySQL) **closed** publicly (`docker-compose.yml` binds it to `127.0.0.1:3306` only).
- [ ] **0.3** **Connect via SSH & Update Ubuntu**:
  ```bash
  ssh -i apisguard-key.pem ubuntu@<EC2_PUBLIC_IP>
  sudo apt update && sudo apt upgrade -y
  ```
- [ ] **0.4** **Install Docker Engine & Docker Compose Plugin**:
  ```bash
  sudo apt install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt update
  sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo usermod -aG docker $USER
  newgrp docker
  ```
- [ ] **0.5** **Verify Docker & Create Project Workspace**:
  ```bash
  docker --version && docker compose version
  mkdir -p ~/apisguard/{backend,frontend,mosquitto/config,mosquitto/data}
  cd ~/apisguard
  ```

---

## Phase 1: Docker Compose, MySQL 8 & Mosquitto MQTT Broker

**Goal**: Create the Docker Compose stack, initialize the MySQL schema, configure authenticated Mosquitto MQTT on AWS, and verify both services.

- [x] **1.1** Create `init.sql` with all 6 tables (`users`, `telemetry` including `temp_top`/`temp_middle`/`temp_bottom`, `actuators`, `actuator_logs`, `alerts`, `settings`) and default seed rows (including `syrup_dispenser`, `geofence_radius_meters = 50`, `max_temp_threshold = 36.00`, and `rapid_weight_loss_kg = 1.50`).
- [x] **1.2** Create `mosquitto/config/mosquitto.conf` for MQTT (`1883`) and WebSocket (`9001`), with persistence enabled (`allow_anonymous true` for local dev; switch to password auth before public AWS exposure):
  ```conf
  listener 1883
  listener 9001
  protocol websockets
  persistence true
  persistence_location /mosquitto/data/
  allow_anonymous false
  password_file /mosquitto/config/passwd
  ```
- [ ] **1.3** (Before AWS deployment) Create the Mosquitto password file for the ESP32 and backend clients:
  ```bash
  docker run --rm -v ~/apisguard/mosquitto/config:/mosquitto/config eclipse-mosquitto:2.0 \
    mosquitto_passwd -b -c /mosquitto/config/passwd apisguard_mqtt <STRONG_MQTT_PASSWORD>
  ```
- [x] **1.4** Create `docker-compose.yml` (plus `.env.example` and `.gitignore`) defining `mysql` (`mysql:8.0`), `mosquitto` (`eclipse-mosquitto:2.0`), and `backend` on `apisguard-net`.
- [ ] **1.5** **Start & Verify MySQL + Mosquitto**:
  ```bash
  docker compose up -d mysql mosquitto
  docker compose ps
  docker exec -it apisguard-mysql mysql -u apisguard_user -p apisguard -e "SHOW TABLES; SELECT * FROM actuators; SELECT * FROM settings;"
  ```
- [ ] **1.6** **Verify MQTT Pub/Sub** (two terminals or background sub):
  ```bash  
  docker exec -it apisguard-mosquitto mosquitto_sub -u apisguard_mqtt -P <STRONG_MQTT_PASSWORD> -t "apisguard/#" -v
  docker exec -it apisguard-mosquitto mosquitto_pub -u apisguard_mqtt -P <STRONG_MQTT_PASSWORD> -t "apisguard/telemetry" -m '{"test":true}'
  ```

---

## Phase 2: Backend API, MQTT Bridge & Automation Rules (`backend/`)

**Goal**: Build the Node.js service that ingests ESP32 telemetry, evaluates alert/actuator rules, stores history in MySQL, and streams updates to the browser.

- [x] **2.1** Initialize `backend/` (`package.json`, TypeScript or Node.js Express entry, `.env`, `Dockerfile`) with `express`, `mysql2`, `mqtt`, `socket.io`, and `cors`.
- [x] **2.2** Implement the MySQL connection pool and MQTT client subscribing to `apisguard/telemetry`, `apisguard/status`, `apisguard/actuators/ack`, and `apisguard/alerts`.
- [x] **2.3** Persist incoming `apisguard/telemetry` payloads (including 3-level `thermalProbes`: `top`, `middle`, `bottom`) into `telemetry` and emit live updates over `Socket.io`.
- [x] **2.4** Implement server-side automation & alert rules driven by `settings` and `actuators`:
  - DHT22 temp `> 36.00°C` (`max_temp_threshold`): trigger `HIGH_TEMP` alert.
  - GPS distance `> 50 m` (`geofence_radius_meters` from `home_latitude`/`home_longitude`): trigger `GEOFENCE_BREACH` alert.
  - MPU6050 theft/fall triggers (`THEFT_TAMPER`, `HIVE_FALL`).
  - Weight drop `>= 0.50 kg` (`rapid_weight_loss_kg` on 5 kg HX711 scale): trigger `RAPID_WEIGHT_LOSS` alert and auto-dispense sugar syrup via Type 3 pump when `syrup_dispenser` `is_auto_mode = TRUE`; weight `>= 4.20 kg` (`harvest_weight_kg`): trigger `HARVEST_READY`.
  - Low battery alert (`LOW_BATTERY` from INA219 sensor).
- [x] **2.5** Expose REST endpoints for initial dashboard load: `GET /api/telemetry/latest`, `GET /api/telemetry/history?hours=24`, `GET /api/actuators`, `POST /api/actuators/command` (publishes to `apisguard/actuators/set` and writes to `actuator_logs`), `GET /api/alerts`, and `PATCH /api/alerts/:id/resolve`.
- [ ] **2.6** **Verify**: Run a Node/Python mock publisher (`src/mockPublisher.ts`) sending sample JSON to `apisguard/telemetry` and confirm rows insert into MySQL, alerts trigger, and `apisguard/actuators/set` messages publish properly (pending AWS MySQL + Mosquitto broker setup).

---

## Phase 3: Single-Page React Dashboard (`frontend/`)

**Goal**: Build the mobile-first, single-page dashboard using Tailwind CSS, Iconify (`@iconify/react`), and Google Maps.

- [x] **3.1** Scaffold `frontend/` with `Vite + React + TypeScript + Tailwind CSS`, `@iconify/react` (no emojis), `@react-google-maps/api`, `socket.io-client`, and `axios`; configure `.env.example` with `VITE_GOOGLE_MAPS_API_KEY`.
- [x] **3.2** Create TypeScript types (`src/types/telemetry.ts`, `src/types/actuator.ts`), utilities (`src/utils/geofence.ts`, `src/utils/formatters.ts`), and API/socket clients (`src/services/api.ts`, `src/services/socket.ts`).
- [x] **3.3** Implement data hooks (`useLiveTelemetry.ts`, `useActuatorControl.ts`, `useHistoricalData.ts`).
- [x] **3.4** Build `Navbar.tsx` as a sticky top navigation bar + mobile bottom navigation bar (`Overview`, `Controls`, `Charts`, `Logs`) with live connection status, battery %, Wi-Fi RSSI, and Iconify icons.
- [x] **3.5** Build `AlertBanner.tsx` and `MetricCardsGrid.tsx` (`MetricCard.tsx`, `BroodTempCard.tsx`, `WeightCard.tsx`, `BeeTrafficCard.tsx`, `MotionSecurityCard.tsx`) as a 2x2 mobile / 4-column desktop KPI strip on `OverviewPage.tsx`.
- [x] **3.6** Build `ActuatorControlPanel.tsx` (`ControlsPage.tsx`) with `GateButtons.tsx` and `SyrupControl.tsx`.
- [x] **3.7** Build `HiveGoogleMap.tsx` (`MapContainer.tsx`, `HiveMarker.tsx`, `GeofenceCircle.tsx`) at the top of `OverviewPage.tsx`, displaying dynamic `N/S` and `E/W` coordinates and geofence status badge.
- [x] **3.8** Build `AnalyticsCharts.tsx` (`ChartsPage.tsx`) with `ClimateLineChart.tsx` (dual-axis Temp & Humidity), `HiveHeatMap2D.tsx` (3-level Top/Mid/Bot 2D heat map), and `WeightAreaChart.tsx` behind tabs, plus `ActivityLogModal.tsx` (`LogsPage.tsx`).
- [x] **3.9** Assemble multi-page `App.tsx` with `react-router-dom` and configure `public/manifest.json` for mobile PWA support.
- [ ] **3.10** **Verify**: Test desktop (`>= 768px`) and mobile (`< 768px`) layouts, route navigation, Google Map rendering, and live updates using the mock MQTT telemetry stream. (`tsc --noEmit && vite build` passed; live MQTT/browser check pending.)

---

## Phase 4: Hardware Wiring & ESP32 Firmware (`firmware/`)

**Goal**: Wire sensors/actuators according to Section 3 and program the ESP32 to stream telemetry and execute commands.

- [ ] **4.1** Bench-wire and power-test components on a breadboard/PCB per Section 3.2 GPIO pinout:
  - `NEO-6M` GPS on `UART2` (`GPIO 16/17`)
  - `MPU6050` (theft/fall IMU) & `INA219` (battery current/voltage) on shared `I2C` (`GPIO 21/22`)
  - `DHT22` on `GPIO 4`, and `3x DS18B20` thermal probes (Top/Mid/Bot) on `GPIO 13` (1-Wire bus)
  - `HX711` + `5kg` load cell on `GPIO 18/19`
  - `2x IR` bee counter sensors on `GPIO 32/33`
  - Entrance Gate Servo (`GPIO 27`), `Type 3` ultra-quiet submersible syrup pump MOSFET/Relay (`GPIO 23`).
- [ ] **4.2** Calibrate the `HX711` 5kg load cell using known weights, record `scale_tare_offset`, and verify `INA219` voltage/current readings against a multimeter.
- [ ] **4.3** Write ESP32 firmware (Arduino/PlatformIO) to connect to Wi-Fi and Mosquitto, read sensors (`DHT22`, `3x DS18B20`, `2x IR`, `MPU6050`, `HX711`, `INA219`, `NEO-6M`), and publish `apisguard/telemetry` and `apisguard/status`.
- [ ] **4.4** Implement `apisguard/actuators/set` command handler on the ESP32 for servo positions (`OPEN`, `GUARD_MODE`, `CLOSED`) and timed `Type 3` sugar syrup pump activation (`durationSec`), publishing confirmations to `apisguard/actuators/ack`.
- [ ] **4.5** **Verify**: Confirm real hardware telemetry arrives in MySQL and appears live on the dashboard, and confirm physical actuators respond to dashboard controls.

---

## Phase 5: End-to-End Verification & Production Deployment

**Goal**: Validate the complete loop under real conditions and deploy the stack to AWS Ubuntu.

- [ ] **5.1** Run full end-to-end scenario tests:
  - Brood temp `> 36°C` triggers `HIGH_TEMP` alert banner.
  - Moving GPS coordinates `> 50 m` from home base flags `GEOFENCE BREACH!` on the map and logs an alert.
  - Simulated rapid weight drop triggers `RAPID_WEIGHT_LOSS` alert and activates the sugar syrup dispenser.
  - Manual controls (Gate 3-state buttons and Type 3 Syrup manual/auto dispense) receive ESP32 `ack` updates.
- [ ] **5.2** Configure Nginx on the AWS Ubuntu instance to serve the built `frontend/dist` static files on port `80` (and `443` with Certbot TLS if using a domain) and reverse-proxy `/api` and `/socket.io` to `http://127.0.0.1:5000`.
- [ ] **5.3** Harden production secrets in `.env` / `docker-compose.yml` (MySQL passwords, Mosquitto credentials, and HTTP referrer restrictions on `VITE_GOOGLE_MAPS_API_KEY`).
- [ ] **5.4** Run `docker compose up -d --build` on the AWS Ubuntu server and verify the full dashboard on both mobile and desktop browsers.
