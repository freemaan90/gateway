# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

NestJS 11 REST API gateway for a WhatsApp messaging platform. Connects to PostgreSQL (Prisma), Redis (ioredis), SMTP (nodemailer), and a BFF microservice over TCP.

## Commands

```bash
npm run start:dev      # watch mode
npm run build
npm run test           # jest unit tests
npm run test:cov
npm run lint

# Run a single test file
npx jest src/path/to/file.spec.ts --no-coverage

# Makefile shortcuts
make up                # docker compose up -d (postgres, pgadmin, redis)
make down
make migrate-dev       # npx prisma migrate dev
make migrate-prod      # npx prisma migrate deploy
make prisma-generate   # regenerate client after schema changes
make prisma-studio
make psql              # shell into postgres container
make redis-cli
```

## Environment

Copy `.env.template` and fill in all variables. `src/config/env.ts` loads env vars **eagerly at import time** using a `required()` helper that throws on startup if any variable is missing — the app will not start with incomplete env.

Required vars: `PORT`, `DATABASE_URL`, `POSTGRES_*`, `PGADMIN_*`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_URL`, `BFF_WHATSAPP_SENDER_HOST`, `BFF_WHATSAPP_SENDER_PORT`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FRONTEND_URL`, `VERIFY_TOKEN`.

## Architecture

### Multi-tenant role hierarchy

Three roles: `OWNER > SUPERVISOR > EMPLOYEE` (defined in `src/enum/Roles.ts`).

- `OWNER`: self-registered via `POST /auth/register`. `ownerId = null`. Owns a tenant (`company`, `companyLogo`).
- `SUPERVISOR`/`EMPLOYEE`: created by an OWNER or SUPERVISOR via `POST /users`. They inherit `ownerId`, `company`, and `companyLogo` from their creator's tenant.
- `User.ownerId` is a self-referential FK — employees point to their OWNER's `id`.

Guards: `JwtGuard` (validates access token) + `RolesGuard` (reads `@Roles()` decorator). Always apply `JwtGuard` before `RolesGuard`.

### Auth flow

JWT tokens stored in HTTP-only cookies (`access_token`, `refresh_token`). Both expire in 7 days. `JwtStrategy` extracts tokens from `Authorization: Bearer` header OR `req.cookies.access_token`.

The `@User()` decorator (`src/common/decorators/user.decorator.ts`) injects the `AuthUser` object from `req.user` into controller handlers. Use it in any JWT-protected route.

### Prisma

Client is generated into `src/generated/prisma/` (non-default path, set in `prisma/schema.prisma` generator). After schema changes, run `make prisma-generate`. Import from `src/generated/prisma/client`.

### Response shape

`TransformInterceptor` applies `instanceToPlain()` to all successful responses (handles `@Exclude()`/`@Expose()` class-transformer decorators). Exception filters: `HttpExceptionFilter` registered first (outer), `ValidationExceptionFilter` registered second (inner, higher priority per NestJS filter ordering).

### BFF microservice (whatsapp-sender)

`WhatsappSenderController` proxies HTTP routes to the BFF over TCP using `ClientProxy` injected as `WHATSAPP_SENDER`. All calls use `firstValueFrom(client.send(...).pipe(catchError(...)))` and rethrow as `ServiceUnavailableException` on failure. Message pattern commands: `whatsapp_sender_health`, `whatsapp_sender_sessions`, `whatsapp_sender_create_session`, `whatsapp_sender_qr`, `whatsapp_sender_session_status`, `whatsapp_sender_delete_session`, `whatsapp_sender_send_message`.

### Redis usage

`RedisService` wraps ioredis with `get/set/del`. Currently used for:
- Password reset tokens: key `password-reset:{uuid}`, TTL 15 minutes, value is `userId` as string.

### Password reset flow

`PasswordService` (`src/user/password/password.service.ts`) handles the full reset flow: generates a UUID token → stores in Redis → sends email via `EmailService`. Token is consumed and deleted on `resetPassword()`.

### Webhook

`POST /webhook` and `GET /webhook` (verification challenge). The `VERIFY_TOKEN` env var is used to verify the Meta webhook handshake.
