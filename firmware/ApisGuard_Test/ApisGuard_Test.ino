#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_INA219.h>
#include <TinyGPSPlus.h>
#include <ESP32Servo.h>

// ===================== USER CONFIGURATION =====================
const char* WIFI_SSID     = "404";
const char* WIFI_PASSWORD = "11111111";

// Use your PC's Wi-Fi IPv4 address (e.g. http://172.16.103.241:5000)
const char* BACKEND_BASE  = "http://192.168.43.137:5000";

// Set to true once you wire the Type 3 Pump on D23
#define ENABLE_PUMP  false
// ==============================================================

// Pin Definitions (DOIT ESP32 DEVKIT V1)
#define DHT_PIN       4
#define DHT_TYPE      DHT22
#define ONE_WIRE_BUS  19
#define GPS_RX        16
#define GPS_TX        17
#define IR_OUTER_PIN  32
#define IR_INNER_PIN  33
#define SERVO_PIN     27
#define PUMP_PIN      23
#define IMU_ADDR      0x68

// Fallback coordinates used indoors before GPS locks satellites
const double DEFAULT_LAT = 6.927079;
const double DEFAULT_LNG = 79.861244;

// Your 3 discovered DS18B20 addresses (swap order if Top/Mid/Bot cables differ)
DeviceAddress probeTopAddr = { 0x28, 0x28, 0x39, 0xC9, 0x00, 0x00, 0x00, 0xD4 };
DeviceAddress probeMidAddr = { 0x28, 0x64, 0x1F, 0xC1, 0x00, 0x00, 0x00, 0xA4 };
DeviceAddress probeBotAddr = { 0x28, 0x92, 0x22, 0xCA, 0x00, 0x00, 0x00, 0x98 };

DHT dht(DHT_PIN, DHT_TYPE);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);
Adafruit_INA219 ina219;
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);
Servo gateServo;

bool inaOk = false;
int lastServoAngle = 0;

// Hardware-interrupt 2x IR Bee Counter
portMUX_TYPE irMux = portMUX_INITIALIZER_UNLOCKED;
volatile int beesIn = 0;
volatile int beesOut = 0;
volatile int irState = 0;
volatile unsigned long irStateStartUs = 0;
volatile unsigned long lastOuterUs = 0;
volatile unsigned long lastInnerUs = 0;

void IRAM_ATTR onOuterFall() {
  unsigned long now = micros();
  portENTER_CRITICAL_ISR(&irMux);
  if (now - lastOuterUs > 5000) {
    lastOuterUs = now;
    if (irState != 0 && (now - irStateStartUs > 1000000)) irState = 0;
    if (irState == 0) { irState = 1; irStateStartUs = now; }
    else if (irState == 2) { beesOut++; irState = 0; }
  }
  portEXIT_CRITICAL_ISR(&irMux);
}

void IRAM_ATTR onInnerFall() {
  unsigned long now = micros();
  portENTER_CRITICAL_ISR(&irMux);
  if (now - lastInnerUs > 5000) {
    lastInnerUs = now;
    if (irState != 0 && (now - irStateStartUs > 1000000)) irState = 0;
    if (irState == 0) { irState = 2; irStateStartUs = now; }
    else if (irState == 1) { beesIn++; irState = 0; }
  }
  portEXIT_CRITICAL_ISR(&irMux);
}

void wakeIMU() {
  Wire.beginTransmission(IMU_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission(true);
}

bool readTiltDeg(float &tiltDeg) {
  Wire.beginTransmission(IMU_ADDR);
  Wire.write(0x3B);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom((uint8_t)IMU_ADDR, (uint8_t)6, (uint8_t)true) != 6) return false;

  int16_t axRaw = (Wire.read() << 8) | Wire.read();
  int16_t ayRaw = (Wire.read() << 8) | Wire.read();
  int16_t azRaw = (Wire.read() << 8) | Wire.read();

  float ax = axRaw / 16384.0;
  float ay = ayRaw / 16384.0;
  float az = azRaw / 16384.0;

  float totalG = sqrt(ax * ax + ay * ay + az * az);
  if (totalG < 0.1) return false;

  float cosAngle = fabs(az) / totalG;
  if (cosAngle > 1.0) cosAngle = 1.0;
  tiltDeg = acos(cosAngle) * 180.0 / PI;
  return true;
}

float estimateBatteryPct(float voltage) {
  if (voltage < 1.0) return 90.0; // Fallback if battery switch is OFF during USB test
  float pct = ((voltage - 11.2) / (16.4 - 11.2)) * 100.0;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(300);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\n[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] Connection timeout — will retry.");
  }
}

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) return;

  // 1. DHT22
  float tempDht = dht.readTemperature();
  float humDht = dht.readHumidity();
  if (isnan(tempDht)) tempDht = 34.5;
  if (isnan(humDht)) humDht = 58.0;

  // 2. 3x DS18B20
  ds18b20.requestTemperatures();
  float tTop = ds18b20.getTempC(probeTopAddr);
  float tMid = ds18b20.getTempC(probeMidAddr);
  float tBot = ds18b20.getTempC(probeBotAddr);
  if (tTop == DEVICE_DISCONNECTED_C) tTop = tempDht + 0.5;
  if (tMid == DEVICE_DISCONNECTED_C) tMid = tempDht;
  if (tBot == DEVICE_DISCONNECTED_C) tBot = tempDht - 1.0;

  // 3. 2x IR Bee Counters
  int curIn, curOut;
  portENTER_CRITICAL(&irMux);
  curIn = beesIn;
  curOut = beesOut;
  portEXIT_CRITICAL(&irMux);

  // 4. IMU Tilt (0x68 / WHO_AM_I 0x74)
  float tiltDeg = 0.0;
  readTiltDeg(tiltDeg);
  bool theftAlert = tiltDeg > 10.0;
  bool fallDetected = tiltDeg > 35.0;

  // 5. INA219 Battery
  float busV = inaOk ? ina219.getBusVoltage_V() : 0.0;
  float currentMa = inaOk ? ina219.getCurrent_mA() : 0.0;
  int batPct = (int)round(estimateBatteryPct(busV));

  // 6. NEO-6M GPS
  double lat = gps.location.isValid() ? gps.location.lat() : DEFAULT_LAT;
  double lng = gps.location.isValid() ? gps.location.lng() : DEFAULT_LNG;
  double alt = gps.altitude.isValid() ? gps.altitude.meters() : 14.5;
  int sats = gps.satellites.isValid() ? (int)gps.satellites.value() : 0;

  // Build JSON matching backend /api/telemetry/ingest
  JsonDocument doc;
  JsonObject metrics = doc["metrics"].to<JsonObject>();
  metrics["temperature"] = round(tempDht * 100.0) / 100.0;
  metrics["humidity"] = round(humDht * 10.0) / 10.0;

  JsonObject probes = metrics["thermalProbes"].to<JsonObject>();
  probes["top"] = round(tTop * 100.0) / 100.0;
  probes["middle"] = round(tMid * 100.0) / 100.0;
  probes["bottom"] = round(tBot * 100.0) / 100.0;

  metrics["weightKg"] = 3.85; // Placeholder until HX711 5kg scale is wired
  metrics["beesIn"] = curIn;
  metrics["beesOut"] = curOut;

  JsonObject motion = metrics["motion"].to<JsonObject>();
  motion["tiltDeg"] = round(tiltDeg * 10.0) / 10.0;
  motion["theftAlert"] = theftAlert;
  motion["fallDetected"] = fallDetected;

  JsonObject loc = doc["location"].to<JsonObject>();
  loc["latitude"] = lat;
  loc["longitude"] = lng;
  loc["altitudeMeters"] = round(alt * 10.0) / 10.0;
  loc["satellites"] = sats;

  JsonObject dev = doc["device"].to<JsonObject>();
  dev["batteryPct"] = batPct;
  dev["batteryVoltage"] = busV > 0.5 ? round(busV * 100.0) / 100.0 : 12.40;
  dev["batteryCurrentMa"] = round(currentMa * 10.0) / 10.0;
  dev["wifiRssi"] = WiFi.RSSI();

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  String url = String(BACKEND_BASE) + "/api/telemetry/ingest";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  http.end();

  Serial.print("[POST /telemetry/ingest] HTTP ");
  Serial.print(code);
  Serial.print(" | Temp=");
  Serial.print(tempDht, 1);
  Serial.print("C Hum=");
  Serial.print(humDht, 0);
  Serial.print("% Tilt=");
  Serial.print(tiltDeg, 1);
  Serial.print("deg IN/OUT=");
  Serial.print(curIn);
  Serial.print("/");
  Serial.println(curOut);
}

void pollActuators() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(BACKEND_BASE) + "/api/actuators";
  http.begin(url);
  int code = http.GET();

  if (code == 200) {
    String payload = http.getString();
    JsonDocument doc;
    if (!deserializeJson(doc, payload)) {
      int angle = doc["entranceGate"]["angle"] | 0;
      if (angle != lastServoAngle) {
        lastServoAngle = angle;
        gateServo.write(angle);
        Serial.print("[ACTUATOR] Gate Servo moved to ");
        Serial.print(angle);
        Serial.println(" deg");
      }

      if (ENABLE_PUMP) {
        bool dispensing = doc["syrupDispenser"]["isDispensing"] | false;
        digitalWrite(PUMP_PIN, dispensing ? LOW : HIGH);
      }
    }
  }
  http.end();
}

unsigned long lastTelemetryMs = 0;
unsigned long lastPollMs = 0;

void setup() {
  Serial.begin(115200);
  delay(500);

  Wire.begin(21, 22);
  wakeIMU();
  inaOk = ina219.begin();

  dht.begin();
  ds18b20.begin();
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  pinMode(IR_OUTER_PIN, INPUT);
  pinMode(IR_INNER_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(IR_OUTER_PIN), onOuterFall, FALLING);
  attachInterrupt(digitalPinToInterrupt(IR_INNER_PIN), onInnerFall, FALLING);

  gateServo.setPeriodHertz(50);
  gateServo.attach(SERVO_PIN, 500, 2400);
  gateServo.write(0);

  if (ENABLE_PUMP) {
    pinMode(PUMP_PIN, OUTPUT);
    digitalWrite(PUMP_PIN, HIGH);
  }

  connectWiFi();
  Serial.println("=== ApisGuard Live HTTP Test Firmware Ready ===");
}

void loop() {
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  unsigned long now = millis();
  if (now - lastTelemetryMs >= 3000) {
    lastTelemetryMs = now;
    sendTelemetry();
  }

  if (now - lastPollMs >= 1500) {
    lastPollMs = now;
    pollActuators();
  }
}
