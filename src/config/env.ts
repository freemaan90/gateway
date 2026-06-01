// src/config/env.ts
import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  BFF_WHATSAPP_SENDER_HOST: required('BFF_WHATSAPP_SENDER_HOST'),
  BFF_WHATSAPP_SENDER_PORT: Number(required('BFF_WHATSAPP_SENDER_PORT')),
  SMTP_HOST: required('SMTP_HOST'),
  SMTP_PORT: Number(required('SMTP_PORT')),
  SMTP_USER: required('SMTP_USER'),
  SMTP_PASS: required('SMTP_PASS'),
  FRONTEND_URL: required('FRONTEND_URL'),
  databaseUrl: required('DATABASE_URL'),

  postgres: {
    user: required('POSTGRES_USER'),
    password: required('POSTGRES_PASSWORD'),
    db: required('POSTGRES_DB'),
  },

  pgadmin: {
    email: required('PGADMIN_EMAIL'),
    password: required('PGADMIN_PASSWORD'),
  },

  jwt: {
    access: required('JWT_ACCESS_SECRET'),
    refresh: required('JWT_REFRESH_SECRET'),
  },

  nodeEnv: process.env.NODE_ENV ?? 'development',
  backendUrl: process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,

  VERIFY_TOKEN: required('VERIFY_TOKEN'),
  REDIS_URL: required('REDIS_URL'),

  MERCADOPAGO_ACCESS_TOKEN: required('MERCADOPAGO_ACCESS_TOKEN'),
  MERCADOPAGO_WEBHOOK_SECRET: required('MERCADOPAGO_WEBHOOK_SECRET'),
  MERCADOPAGO_SUCCESS_URL: required('MERCADOPAGO_SUCCESS_URL'),
  MERCADOPAGO_FAILURE_URL: required('MERCADOPAGO_FAILURE_URL'),
  MERCADOPAGO_PENDING_URL: required('MERCADOPAGO_PENDING_URL'),
};
