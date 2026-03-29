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
};
