# ApisGuard — AWS Ubuntu Server Setup Guide (Option A)

This guide walks you through setting up the **AWS Ubuntu Free Tier** server running **MySQL 8.0** and **Eclipse Mosquitto (MQTT)** inside Docker, while running `backend/` and `frontend/` on your local PC.

## Architecture Overview (Option A)

```text
+-----------------------+        MQTT (1883)        +------------------------------+
|  ESP32 Smart Hive     | ------------------------> |  AWS EC2 (Ubuntu Free Tier)  |
|  (Wi-Fi + Sensors)    | <------------------------ |  Docker:                     |
+-----------------------+    apisguard/actuators    |   - mosquitto (1883)         |
                                                    |   - mysql:8.0 (3306)         |
+-----------------------+                           +------------------------------+
|  Your PC (Local)      |                                  ^                ^
|   - frontend/ (:5173) | <---- REST + Socket.io ----+     |                |
|   - backend/  (:5000) | ---------------- MQTT (1883) ----+                |
|                       | ---------------- MySQL (3306) --------------------+
+-----------------------+
```

- **AWS EC2**: Runs only `mysql` and `mosquitto` in Docker to stay comfortably inside Free Tier RAM/CPU limits.
- **Local PC**: Runs `backend/` (Node.js/Express + Socket.io + automation rules) and `frontend/` (React dashboard).

---

## Step 1: Launch an AWS EC2 Ubuntu Instance

1. Sign in to **AWS Console** -> **EC2** -> **Launch Instance**.
2. Set the following options:
   - **Name**: `apisguard-db-mqtt`
   - **OS Image (AMI)**: `Ubuntu Server 24.04 LTS` (64-bit x86)
   - **Instance type**: Free-tier eligible (`t2.micro` or `t3.micro`, 1 GB RAM)
   - **Key pair**: Create new key pair -> Name: `apisguard-key` -> Format: `.pem` -> Download and save safely.
   - **Storage**: `20 GB gp3` (Free Tier includes up to 30 GB EBS).
3. Under **Network settings (Security Group)**, configure these **Inbound Rules**:

| Type | Port | Source | Why |
| :--- | :--- | :--- | :--- |
| SSH | `22` | **My IP** | Secure SSH access from your PC only |
| Custom TCP | `3306` | **My IP** | Lets your local `backend/` connect to MySQL without exposing DB to the world |
| Custom TCP | `1883` | `0.0.0.0/0` (or My IP during testing) | Needed by ESP32 (over cellular/Wi-Fi) and your local `backend/` |

> **Important Security Note**: Never open port `3306` to `0.0.0.0/0`. Restrict `3306` to **My IP**. If your home router IP changes later, edit that Security Group rule in AWS Console and click **My IP** again.

4. Launch the instance and copy its **Public IPv4 address** (for example, `13.233.xx.xx`).
   - *(Optional)* Under **EC2 -> Elastic IPs**, allocate an Elastic IP and associate it with this instance so the IP does not change if you stop and start EC2.

---

## Step 2: Connect via SSH

Open PowerShell on Windows in the folder containing `apisguard-key.pem`:

```powershell
ssh -i .\apisguard-key.pem ubuntu@<YOUR_AWS_PUBLIC_IP>
```

Type `yes` if asked about the host fingerprint.

*(If Windows complains that permissions on `.pem` are too open, run `icacls .\apisguard-key.pem /inheritance:r /grant:r "$($env:USERNAME):(R)"` and retry SSH.)*

---

## Step 3: Add a 2 GB Swap File (Recommended for Free Tier 1 GB RAM)

MySQL 8.0 can run out of memory on 1 GB RAM during startup unless swap space is available. On the Ubuntu server, run:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

---

## Step 4: Install Docker Engine & Docker Compose

Run on the AWS Ubuntu server:

```bash
sudo apt update && sudo apt upgrade -y
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

Verify installation:

```bash
docker --version
docker compose version
```

---

## Step 5: Create the ApisGuard Server Folder & Config Files

Create the directory structure on Ubuntu:

```bash
mkdir -p ~/apisguard/mosquitto/config ~/apisguard/mosquitto/data
cd ~/apisguard
```

### 5.1 Create `.env` on AWS Server

Replace `<STRONG_ROOT_PASS>` and `<STRONG_DB_PASS>` with strong passwords:

```bash
cat << 'EOF' > ~/apisguard/.env
MYSQL_ROOT_PASSWORD=<STRONG_ROOT_PASS>
MYSQL_DATABASE=apisguard
MYSQL_USER=apisguard_user
MYSQL_PASSWORD=<STRONG_DB_PASS>
EOF
```

### 5.2 Create `init.sql`

This initializes all 6 tables (`users`, `telemetry` for DHT22, 3x DS18B20 probes, 2x IR bee counters, MPU6050, HX711 5kg weight, NEO-6M GPS, and INA219 battery metrics, `actuators` for Entrance Gate Servo & Type 3 Syrup Pump, `actuator_logs`, `alerts`, `settings`) and default seed rows matching `backend/`:

```bash
cat << 'EOF' > ~/apisguard/init.sql
CREATE DATABASE IF NOT EXISTS apisguard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE apisguard;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telemetry (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    temperature DECIMAL(4, 2),
    humidity DECIMAL(4, 2),
    temp_top DECIMAL(4, 2),
    temp_middle DECIMAL(4, 2),
    temp_bottom DECIMAL(4, 2),
    weight_kg DECIMAL(6, 2),
    bees_in INT,
    bees_out INT,
    tilt_deg DECIMAL(5, 2),
    theft_alert BOOLEAN DEFAULT FALSE,
    fall_detected BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    altitude_meters DECIMAL(6, 2),
    satellites_connected INT,
    battery_pct INT,
    battery_voltage DECIMAL(5, 2),
    battery_current_ma DECIMAL(7, 2),
    wifi_rssi INT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recorded_at (recorded_at DESC)
);

CREATE TABLE IF NOT EXISTS actuators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('entrance_gate', 'syrup_dispenser') NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    current_state VARCHAR(50) DEFAULT 'OFF',
    is_auto_mode BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO actuators (type, name, current_state, is_auto_mode) VALUES
('entrance_gate', 'Entrance Gate Servo', 'OPEN', FALSE),
('syrup_dispenser', 'Type 3 Sugar Syrup Pump', 'OFF', TRUE)
ON DUPLICATE KEY UPDATE id=id;

CREATE TABLE IF NOT EXISTS actuator_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actuator_type ENUM('entrance_gate', 'syrup_dispenser') NOT NULL,
    triggered_by ENUM('manual_web', 'auto_rule') NOT NULL,
    command_details VARCHAR(255) NOT NULL,
    status ENUM('sent', 'acknowledged', 'failed') DEFAULT 'sent',
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_type ENUM('HIGH_TEMP', 'LOW_TEMP', 'THEFT_TAMPER', 'HIVE_FALL', 'RAPID_WEIGHT_LOSS', 'HARVEST_READY', 'GEOFENCE_BREACH', 'LOW_BATTERY') NOT NULL,
    severity ENUM('info', 'warning', 'critical') DEFAULT 'warning',
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO settings (setting_key, setting_value) VALUES
('home_latitude', '6.927079'),
('home_longitude', '79.861244'),
('geofence_radius_meters', '50'),
('max_temp_threshold', '36.00'),
('rapid_weight_loss_kg', '0.50'),
('harvest_weight_kg', '4.20'),
('scale_tare_offset', '0.00')
ON DUPLICATE KEY UPDATE setting_key=setting_key;
EOF
```

### 5.3 Create `mosquitto/config/mosquitto.conf` & Password File

Write `mosquitto.conf` with authentication enabled (`allow_anonymous false`):

```bash
cat << 'EOF' > ~/apisguard/mosquitto/config/mosquitto.conf
listener 1883
persistence true
persistence_location /mosquitto/data/
allow_anonymous false
password_file /mosquitto/config/passwd
EOF
```

Generate the Mosquitto password file (replace `<STRONG_MQTT_PASS>` with your chosen MQTT password):

```bash
docker run --rm -v ~/apisguard/mosquitto/config:/mosquitto/config eclipse-mosquitto:2.0 \
  mosquitto_passwd -b -c /mosquitto/config/passwd apisguard_mqtt <STRONG_MQTT_PASS>
```

Ensure Mosquitto inside the container can read/write its config and data folders:

```bash
sudo chown -R 1883:1883 ~/apisguard/mosquitto/data
sudo chmod 644 ~/apisguard/mosquitto/config/mosquitto.conf
sudo chmod 600 ~/apisguard/mosquitto/config/passwd
sudo chown 1883:1883 ~/apisguard/mosquitto/config/passwd
```

### 5.4 Create `docker-compose.yml`

This starts **only** `mysql` and `mosquitto`, tuned gently for Free Tier memory limits:

```bash
cat << 'EOF' > ~/apisguard/docker-compose.yml
services:
  mysql:
    image: mysql:8.0
    container_name: apisguard-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "3306:3306"
    command:
      - --innodb-buffer-pool-size=128M
      - --performance-schema=OFF
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -u$$MYSQL_USER -p$$MYSQL_PASSWORD"]
      interval: 10s
      timeout: 5s
      retries: 10

  mosquitto:
    image: eclipse-mosquitto:2.0
    container_name: apisguard-mosquitto
    restart: unless-stopped
    ports:
      - "1883:1883"
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data

volumes:
  mysql_data:
EOF
```

---

## Step 6: Start & Verify the AWS Containers

Start both services:

```bash
cd ~/apisguard
docker compose up -d
docker compose ps
```

Wait ~20 seconds for MySQL first-time initialization, then verify tables and seed rows:

```bash
docker exec -it apisguard-mysql mysql -u apisguard_user -p apisguard -e "SHOW TABLES; SELECT * FROM actuators; SELECT * FROM settings;"
```

Test MQTT pub/sub on the server using two SSH sessions (or subscribe briefly):

```bash
# Terminal 1 (listen on all apisguard topics)
docker exec -it apisguard-mosquitto mosquitto_sub -u apisguard_mqtt -P <STRONG_MQTT_PASS> -t "apisguard/#" -v

# Terminal 2 (publish test message)
docker exec -it apisguard-mosquitto mosquitto_pub -u apisguard_mqtt -P <STRONG_MQTT_PASS> -t "apisguard/status" -m '{"online":true}'
```

*(Note: If `mosquitto_passwd` warning about `0700` permissions appears in `docker logs apisguard-mosquitto`, verify `docker logs apisguard-mosquitto` shows `mosquitto version 2.0.x running` and zero fatal errors.)*

---

## Step 7: Connect Your Local PC Backend & Frontend

### 7.1 Configure Local `backend/.env`

On your Windows PC inside `c:\project\ApisGuard\backend\`, copy `.env.example` to `.env` and fill in your AWS server IP and passwords:

```env
PORT=5000
CORS_ORIGIN=http://localhost:5173

DB_HOST=<YOUR_AWS_PUBLIC_IP>
DB_PORT=3306
DB_USER=apisguard_user
DB_PASSWORD=<STRONG_DB_PASS>
DB_NAME=apisguard

MQTT_URL=mqtt://<YOUR_AWS_PUBLIC_IP>:1883
MQTT_USERNAME=apisguard_mqtt
MQTT_PASSWORD=<STRONG_MQTT_PASS>
```

Start the backend locally:

```powershell
cd c:\project\ApisGuard\backend
npm run dev
```

Confirm both AWS services are connected by checking:
- Terminal output should show `[MySQL] Connected` and `[MQTT] Connected to broker`.
- Open `http://localhost:5000/api/health` in your browser -> verify `"mysql": "connected"` and `"mqtt": "connected"`.

### 7.2 Test End-to-End with Mock Telemetry

While `npm run dev` is running in one terminal, run the included mock publisher in a second terminal:

```powershell
cd c:\project\ApisGuard\backend
npx tsx src/mockPublisher.ts
```

This publishes simulated `DHT22`, `3x DS18B20` probes, `2x IR` bee traffic, `MPU6050` motion, `HX711 5kg` weight, `INA219` battery, and `NEO-6M` GPS telemetry to your AWS Mosquitto broker -> your local backend receives it, stores it in AWS MySQL, evaluates alerts/geofence/harvest rules, and streams live Socket.io updates.

### 7.3 Configure & Run Local `frontend/`

In `c:\project\ApisGuard\frontend\`, copy `.env.example` to `.env` and add your Google Maps API key:

```env
VITE_GOOGLE_MAPS_API_KEY=<YOUR_GOOGLE_MAPS_KEY>
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the dashboard:

```powershell
cd c:\project\ApisGuard\frontend
npm run dev
```

Open `http://localhost:5173` to verify live telemetry, Google Map geofencing, actuator controls, 3-level heat map, and logs.

---

## Useful AWS Maintenance Commands

```bash
# Check running containers and RAM usage
docker compose ps
docker stats --no-stream

# View logs
docker compose logs -f mysql
docker compose logs -f mosquitto

# Restart after config edits
docker compose restart
```
