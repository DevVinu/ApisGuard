# ApisGuard — Complete AWS Hosting Guide (Frontend + Backend + MySQL + Mosquitto)

This single end-to-end guide walks you through hosting the **entire ApisGuard system** (`frontend/`, `backend/`, `MySQL 8.0`, and `Eclipse Mosquitto`) directly on an **AWS Ubuntu EC2** server.

---

## Architecture Overview

```text
Internet / Phone / Laptop Browser
        |
        v  (HTTP :80 / HTTPS :443)
+---------------------------------------------------------------+
|  AWS Ubuntu EC2 Server                                        |
|                                                               |
|  Nginx (:80)                                                  |
|   ├── /            -> serves frontend/dist (React SPA)        |
|   ├── /api/*       -> proxy_pass http://127.0.0.1:5000        |
|   └── /socket.io/* -> proxy_pass http://127.0.0.1:5000 (WS)   |
|                                                               |
|  Node.js + PM2 (:5000) -> backend/dist/app.js                 |
|   ├── MySQL 8.0 (Docker, 127.0.0.1:3306)                      |
|   └── Mosquitto (Docker, 0.0.0.0:1883  <-- ESP32 over Wi-Fi)  |
+---------------------------------------------------------------+
```

---

## Step 1: Launch an AWS EC2 Ubuntu Instance

1. Sign in to **AWS Console** -> **EC2** -> **Launch Instance**.
2. Configure:
   - **Name**: `apisguard-server`
   - **OS Image (AMI)**: `Ubuntu Server 24.04 LTS` (64-bit x86)
   - **Instance type**: Free-tier eligible (`t2.micro` or `t3.micro`, 1 GB RAM)
   - **Key pair**: Create new key pair -> Name: `apisguard-key` -> Format: `.pem` -> Download and save safely.
   - **Storage**: `20 GB gp3` (Free Tier includes up to 30 GB EBS).
3. Under **Network settings (Security Group)**, add these **Inbound Rules**:

| Type | Port | Source | Why |
| :--- | :--- | :--- | :--- |
| SSH | `22` | **My IP** | Secure SSH access from your PC only |
| HTTP | `80` | `0.0.0.0/0` | Public web dashboard (`frontend/` + proxied `/api` & `/socket.io`) |
| HTTPS | `443` | `0.0.0.0/0` | Optional SSL if you add a domain later |
| Custom TCP | `1883` | `0.0.0.0/0` | MQTT connections from your ESP32 |

   - **Keep port `3306` (MySQL) and `5000` (Backend) closed publicly** — Nginx and `backend/` communicate with them over `127.0.0.1` inside the EC2 server.
4. Launch the instance, then under **EC2 -> Elastic IPs**, allocate an **Elastic IP** and associate it with this instance so your public IPv4 address never changes on reboot.

---

## Step 2: Connect via SSH

Open PowerShell on Windows in the folder containing `apisguard-key.pem`:

```powershell
ssh -i .\apisguard-key.pem ubuntu@<YOUR_AWS_PUBLIC_IP>
```

Type `yes` if prompted about the host fingerprint.

*(If Windows complains about `.pem` permissions, run `icacls .\apisguard-key.pem /inheritance:r /grant:r "$($env:USERNAME):(R)"` and retry SSH.)*

---

## Step 3: Add a 2 GB Swap File (Required for 1 GB Free Tier RAM)

MySQL 8.0 and Node.js can run out of memory on 1 GB RAM without swap space:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

---

## Step 4: Install Docker, Node.js 22, PM2 & Nginx

Run on the AWS Ubuntu server:

### 4.1 Install Docker & Docker Compose

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

### 4.2 Install Node.js 22, PM2 & Nginx

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2

docker --version && docker compose version && node -v && nginx -v
```

---

## Step 5: Configure MySQL 8.0 & Mosquitto on EC2

Create the server workspace:

```bash
mkdir -p ~/apisguard/mosquitto/config ~/apisguard/mosquitto/data
cd ~/apisguard
```

### 5.1 Create `~/apisguard/.env`

Replace `<STRONG_ROOT_PASS>` and `<STRONG_DB_PASS>` with strong passwords:

```bash
cat << 'EOF' > ~/apisguard/.env
MYSQL_ROOT_PASSWORD=<STRONG_ROOT_PASS>
MYSQL_DATABASE=apisguard
MYSQL_USER=apisguard_user
MYSQL_PASSWORD=<STRONG_DB_PASS>
EOF
```

### 5.2 Create `~/apisguard/init.sql`

This initializes all 6 tables (`users`, `telemetry` for `DHT22`, `3x DS18B20` probes, `2x IR` bee counters, `MPU6050`, `HX711 5kg` weight, `NEO-6M` GPS, and `INA219` battery metrics, `actuators` for Entrance Gate Servo & Type 3 Syrup Pump, `actuator_logs`, `alerts`, `settings`) and default seed rows:

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

### 5.3 Create `mosquitto.conf` & Password File

```bash
cat << 'EOF' > ~/apisguard/mosquitto/config/mosquitto.conf
listener 1883
persistence true
persistence_location /mosquitto/data/
allow_anonymous false
password_file /mosquitto/config/passwd
EOF
```

Generate the Mosquitto password file (replace `<STRONG_MQTT_PASS>`):

```bash
docker run --rm -v ~/apisguard/mosquitto/config:/mosquitto/config eclipse-mosquitto:2.0 \
  mosquitto_passwd -b -c /mosquitto/config/passwd apisguard_mqtt <STRONG_MQTT_PASS>

sudo chown -R 1883:1883 ~/apisguard/mosquitto/data
sudo chmod 644 ~/apisguard/mosquitto/config/mosquitto.conf
sudo chmod 600 ~/apisguard/mosquitto/config/passwd
sudo chown 1883:1883 ~/apisguard/mosquitto/config/passwd
```

### 5.4 Create `~/apisguard/docker-compose.yml`

MySQL binds strictly to `127.0.0.1:3306` so only the local `backend/` on EC2 can access it:

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
      - "127.0.0.1:3306:3306"
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

## Step 6: Start & Verify MySQL and Mosquitto

```bash
cd ~/apisguard
docker compose up -d
docker compose ps
```

Wait ~20 seconds for MySQL initialization, then verify tables and seed rows:

```bash
docker exec -it apisguard-mysql mysql -u apisguard_user -p apisguard -e "SHOW TABLES; SELECT * FROM actuators; SELECT * FROM settings;"
```

Test MQTT pub/sub on EC2:

```bash
# Terminal 1 (listen)
docker exec -it apisguard-mosquitto mosquitto_sub -u apisguard_mqtt -P <STRONG_MQTT_PASS> -t "apisguard/#" -v

# Terminal 2 (publish test)
docker exec -it apisguard-mosquitto mosquitto_pub -u apisguard_mqtt -P <STRONG_MQTT_PASS> -t "apisguard/status" -m '{"online":true}'
```

---

## Step 7: Build `frontend/` & `backend/` on Your PC and Upload via `scp`

Building on your Windows PC avoids memory spikes on the 1 GB Free Tier instance.

### 7.1 Build `frontend/`

In `c:\project\ApisGuard\frontend\.env`, set your AWS Public IP:

```env
VITE_MAP_TILE_API_KEY=<YOUR_CARTO_TILE_KEY>
VITE_API_BASE_URL=http://<YOUR_AWS_PUBLIC_IP>/api
VITE_SOCKET_URL=http://<YOUR_AWS_PUBLIC_IP>
```

Build the production bundle:

```powershell
cd c:\project\ApisGuard\frontend
npm run build
```

### 7.2 Build `backend/`

```powershell
cd c:\project\ApisGuard\backend
npm run build
```

### 7.3 Upload Built Files to EC2

From PowerShell in the folder with `apisguard-key.pem`:

```powershell
ssh -i .\apisguard-key.pem ubuntu@<YOUR_AWS_PUBLIC_IP> "mkdir -p ~/apisguard/backend ~/apisguard/frontend"

scp -i .\apisguard-key.pem -r c:\project\ApisGuard\frontend\dist ubuntu@<YOUR_AWS_PUBLIC_IP>:~/apisguard/frontend/
scp -i .\apisguard-key.pem c:\project\ApisGuard\backend\package.json c:\project\ApisGuard\backend\package-lock.json ubuntu@<YOUR_AWS_PUBLIC_IP>:~/apisguard/backend/
scp -i .\apisguard-key.pem -r c:\project\ApisGuard\backend\dist ubuntu@<YOUR_AWS_PUBLIC_IP>:~/apisguard/backend/
```

---

## Step 8: Configure & Start `backend/` with PM2 on EC2

On the AWS Ubuntu server:

```bash
cd ~/apisguard/backend
npm ci --omit=dev
```

Create `~/apisguard/backend/.env`:

```bash
cat << 'EOF' > ~/apisguard/backend/.env
PORT=5000
CORS_ORIGIN=http://<YOUR_AWS_PUBLIC_IP>

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=apisguard_user
DB_PASSWORD=<STRONG_DB_PASS>
DB_NAME=apisguard

MQTT_URL=mqtt://127.0.0.1:1883
MQTT_USERNAME=apisguard_mqtt
MQTT_PASSWORD=<STRONG_MQTT_PASS>
EOF
```

Start the backend with PM2 and enable auto-start on reboot:

```bash
pm2 start dist/app.js --name apisguard-api
pm2 save
pm2 startup
```

*(Run the `sudo env PATH=...` command printed by `pm2 startup`.)*

Verify backend health on EC2:

```bash
curl http://127.0.0.1:5000/api/health
```

Expected: `{"status":"ok","mysql":"connected","mqtt":"connected",...}`.

---

## Step 9: Configure Nginx to Serve `frontend/` and Proxy `/api` + `/socket.io`

Copy `frontend/dist` to `/var/www/apisguard`:

```bash
sudo mkdir -p /var/www/apisguard
sudo cp -r ~/apisguard/frontend/dist/* /var/www/apisguard/
sudo chown -R www-data:www-data /var/www/apisguard
```

Create `/etc/nginx/sites-available/apisguard`:

```bash
sudo tee /etc/nginx/sites-available/apisguard > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    root /var/www/apisguard;
    index index.html;

    # React Router SPA fallback (/controls, /charts, /logs)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Node.js REST API
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Socket.io WebSocket upgrade
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
```

Enable the site and restart Nginx:

```bash
sudo ln -sf /etc/nginx/sites-available/apisguard /etc/nginx/sites-enabled/apisguard
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 10: Verify Live Public Access

1. Open `http://<YOUR_AWS_PUBLIC_IP>` from any browser or phone.
2. Check `http://<YOUR_AWS_PUBLIC_IP>/api/health` -> `"mysql": "connected"`, `"mqtt": "connected"`.
3. Test all 4 pages (`/`, `/controls`, `/charts`, `/logs`) and refresh `/charts` directly to verify Nginx SPA routing.
4. Point your ESP32 MQTT client to `<YOUR_AWS_PUBLIC_IP>:1883` using `apisguard_mqtt` + `<STRONG_MQTT_PASS>`.

---

## Useful Maintenance & Redeploy Commands

```bash
# On EC2: check Docker, PM2, and memory usage
docker compose -f ~/apisguard/docker-compose.yml ps
pm2 status
pm2 logs apisguard-api --lines 50
free -h

# After frontend code updates (build on PC -> scp -> copy)
sudo cp -r ~/apisguard/frontend/dist/* /var/www/apisguard/

# After backend code updates (build on PC -> scp -> restart)
pm2 restart apisguard-api
```
