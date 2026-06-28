'use strict';
// Production config — used by `prisma migrate deploy` in Docker (no ts-node available).
// Development uses prisma.config.ts (loaded via ts-node).
const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
