import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'apisguard_user',
    password: process.env.DB_PASSWORD || 'apisguard_password_dev',
    database: process.env.DB_NAME || 'apisguard',
  },
  mqtt: {
    url: process.env.MQTT_URL || 'mqtt://127.0.0.1:1883',
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
  },
};
