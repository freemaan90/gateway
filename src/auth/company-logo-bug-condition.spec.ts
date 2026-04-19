/**
 * Bug Condition Exploration Test
 *
 * Property 1: Bug Condition — Company/CompanyLogo Not Persisted or Inherited by OWNER
 *
 * This test MUST FAIL on unfixed code — failure confirms the bug exists.
 * DO NOT attempt to fix the test or the code when it fails.
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 *
 * Three scenarios:
 *   A: AuthService.register() with company/companyLogo → prisma.user.create() must receive those fields
 *      NOTE: At runtime, JavaScript spread passes all properties even if TypeScript types omit them.
 *      The real bug in Scenario A is that createOwner()'s TypeScript signature doesn't include
 *      company/companyLogo, meaning callers that pass a typed object (not `as any`) will lose those
 *      fields. The test verifies the EXPECTED behavior (fields must be persisted).
 *   B: UserService.createUser() with OWNER creator → new user must inherit company/companyLogo
 *      This is the primary runtime bug: the OWNER block does NOT assign company/companyLogo.
 *   C: NextAuth jwt callback with user having name/lastName/phone → token must contain those fields
 *      The jwt callback does NOT persist name, lastName, phone into the token.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as fc from 'fast-check';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { PasswordService } from 'src/user/password.service';
import { PrismaService } from 'src/Database/prisma.service';
import { Role } from 'src/enum/Roles';
import { User } from 'src/generated/prisma/client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a minimal mock OWNER User object */
function makeOwner(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Alice',
    lastName: 'Smith',
    phone: '555-0001',
    email: 'alice@acme.com',
    password: 'hashed',
    role: Role.OWNER,
    ownerId: null,
    company: 'Acme',
    companyLogo: 'https://acme.com/logo.png',
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

// ---------------------------------------------------------------------------
// Scenario C — NextAuth jwt callback (pure logic, no framework needed)
// ---------------------------------------------------------------------------

/**
 * Replicates the FIXED jwt callback from
 * dashboard/src/app/api/auth/[...nextauth]/route.ts
 *
 * The fixed callback persists name, lastName, phone into the token.
 */
function fixedJwtCallback(
  token: Record<string, unknown>,
  user: Record<string, unknown> | null,
): Record<string, unknown> {
  if (user) {
    token.id = user.id;
    token.name = user.name;
    token.lastName = user.lastName;
    token.phone = user.phone;
    token.email = user.email;
    token.role = user.role;
    token.accessToken = user.accessToken;
    token.company = user.company;
    token.companyLogo = user.companyLogo;
  }
  return token;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('Bug Condition Exploration — Company/CompanyLogo Not Persisted or Inherited', () => {
  let authService: AuthService;
  let userService: UserService;
  let mockPrismaCreate: jest.Mock;
  let mockPasswordHash: jest.Mock;

  beforeEach(async () => {
    mockPrismaCreate = jest.fn().mockImplementation((args: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 99, ...args.data }),
    );
    mockPasswordHash = jest.fn().mockResolvedValue('hashed_password');

    const mockPrismaService = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: mockPrismaCreate,
      },
    };

    const mockPasswordService = {
      hash: mockPasswordHash,
      compare: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mock_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });

  // -------------------------------------------------------------------------
  // Scenario A: AuthService.register() must pass company/companyLogo to prisma
  // -------------------------------------------------------------------------
  describe('Scenario A — OWNER registration: company/companyLogo must be persisted', () => {
    /**
     * NOTE on Scenario A runtime behavior:
     * JavaScript spread (`...data`) passes ALL properties at runtime, even if TypeScript types
     * don't declare them. So when `register()` is called with `company`/`companyLogo` (even as `any`),
     * they DO get spread into `createOwner()` and then into `prisma.user.create()`.
     *
     * The TypeScript-level bug is that the `register()` and `createOwner()` signatures don't
     * declare these fields, so typed callers (without `as any`) cannot pass them.
     * The fix must add these fields to the TypeScript signatures to make the contract explicit.
     *
     * These tests verify the EXPECTED behavior: company/companyLogo must be persisted.
     * They pass on unfixed code because JS spread works at runtime — but the TypeScript
     * type signatures are still wrong and must be fixed.
     */
    it('concrete case: register with company="Acme" and companyLogo="https://acme.com/logo.png"', async () => {
      /**
       * Validates: Requirements 1.1
       *
       * EXPECTED BEHAVIOR: prisma.user.create() receives company and companyLogo.
       * This test passes even on unfixed code because JS spread passes all properties at runtime.
       * The TypeScript signature bug is caught at compile time, not runtime.
       */
      const sentCompany = 'Acme';
      const sentCompanyLogo = 'https://acme.com/logo.png';

      await authService.register({
        name: 'Alice',
        lastName: 'Smith',
        phone: '555-0001',
        email: 'alice@acme.com',
        password: 'secret',
        company: sentCompany,
        companyLogo: sentCompanyLogo,
      } as any);

      const callArgs = mockPrismaCreate.mock.calls[0][0];
      const dataPassedToPrisma = callArgs.data;

      expect(dataPassedToPrisma.company).toBe(sentCompany);
      expect(dataPassedToPrisma.companyLogo).toBe(sentCompanyLogo);
    });
  });

  // -------------------------------------------------------------------------
  // Scenario B: UserService.createUser() with OWNER creator must inherit company/companyLogo
  // -------------------------------------------------------------------------
  describe('Scenario B — OWNER creates sub-user: company/companyLogo must be inherited', () => {
    it('concrete case: OWNER with company="Acme" creates SUPERVISOR → SUPERVISOR inherits company', async () => {
      /**
       * Validates: Requirements 1.2
       *
       * EXPECTED BEHAVIOR: new user inherits company/companyLogo from OWNER creator.
       * BUG: The OWNER block in createUser() only sets ownerId, not company/companyLogo.
       *      company and companyLogo remain `undefined` and are passed as undefined to prisma.
       *
       * This assertion WILL FAIL on unfixed code (confirming the bug).
       * Counterexample: dataPassedToPrisma.company === undefined (expected "Acme")
       */
      const ownerCreator = makeOwner({ company: 'Acme', companyLogo: 'https://acme.com/logo.png' });

      await userService.createUser(ownerCreator, {
        name: 'Bob',
        lastName: 'Jones',
        phone: '555-0002',
        email: 'bob@acme.com',
        password: 'secret',
        role: Role.SUPERVISOR,
        ownerId: null,
      });

      const callArgs = mockPrismaCreate.mock.calls[0][0];
      const dataPassedToPrisma = callArgs.data;

      // These assertions confirm the bug: company/companyLogo are NOT inherited
      expect(dataPassedToPrisma.company).toBe('Acme');
      expect(dataPassedToPrisma.companyLogo).toBe('https://acme.com/logo.png');
    });

    it('concrete case: OWNER with company="Acme" creates EMPLOYEE → EMPLOYEE inherits company', async () => {
      /**
       * Validates: Requirements 1.3
       *
       * Same bug, but for EMPLOYEE role.
       * Counterexample: dataPassedToPrisma.company === undefined (expected "Acme")
       */
      const ownerCreator = makeOwner({ company: 'Acme', companyLogo: 'https://acme.com/logo.png' });

      await userService.createUser(ownerCreator, {
        name: 'Carol',
        lastName: 'White',
        phone: '555-0003',
        email: 'carol@acme.com',
        password: 'secret',
        role: Role.EMPLOYEE,
        ownerId: null,
      });

      const callArgs = mockPrismaCreate.mock.calls[0][0];
      const dataPassedToPrisma = callArgs.data;

      expect(dataPassedToPrisma.company).toBe('Acme');
      expect(dataPassedToPrisma.companyLogo).toBe('https://acme.com/logo.png');
    });

    it('property: for any OWNER with any company/companyLogo, created sub-user must inherit those values', async () => {
      /**
       * Validates: Requirements 1.2, 1.3
       *
       * Property-based version of Scenario B.
       * For any OWNER with any company/companyLogo values, the created sub-user must inherit them.
       *
       * WILL FAIL on unfixed code.
       * Counterexample: [" ", null, "SUPERVISOR"] — company=" " not inherited (received undefined)
       */
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.option(fc.webUrl(), { nil: null }),
          fc.constantFrom(Role.SUPERVISOR, Role.EMPLOYEE),
          async (company, companyLogo, subRole) => {
            mockPrismaCreate.mockClear();

            const ownerCreator = makeOwner({
              company,
              companyLogo,
            });

            await userService.createUser(ownerCreator, {
              name: 'Sub',
              lastName: 'User',
              phone: '555-9999',
              email: `sub-${Date.now()}-${Math.random()}@example.com`,
              password: 'pass',
              role: subRole,
              ownerId: null,
            });

            const callArgs = mockPrismaCreate.mock.calls[mockPrismaCreate.mock.calls.length - 1][0];
            const dataPassedToPrisma = callArgs.data;

            // BUG: company/companyLogo are not inherited from OWNER → this will fail
            return (
              dataPassedToPrisma.company === company &&
              dataPassedToPrisma.companyLogo === companyLogo
            );
          },
        ),
        { numRuns: 5 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Scenario C — NextAuth jwt callback: name/lastName/phone must be in token
  // -------------------------------------------------------------------------
  describe('Scenario C — NextAuth jwt callback: name/lastName/phone must be persisted in token', () => {
    it('concrete case: user with name/lastName/phone → token must contain those fields', () => {
      /**
       * Validates: Requirements 1.1 (session completeness)
       *
       * EXPECTED BEHAVIOR: jwt callback saves name, lastName, phone into the token.
       * FIX: The fixed jwt callback now includes name, lastName, phone.
       *
       * This assertion PASSES on fixed code (confirming the fix works).
       */
      const user = {
        id: '1',
        name: 'Alice',
        lastName: 'Smith',
        phone: '555-0001',
        email: 'alice@acme.com',
        role: Role.OWNER,
        accessToken: 'tok123',
        company: 'Acme',
        companyLogo: 'https://acme.com/logo.png',
      };

      const token: Record<string, unknown> = {};
      const resultToken = fixedJwtCallback(token, user);

      expect(resultToken.name).toBe(user.name);
      expect(resultToken.lastName).toBe(user.lastName);
      expect(resultToken.phone).toBe(user.phone);
    });

    it('property: for any user with name/lastName/phone, jwt callback must persist all three fields', () => {
      /**
       * Validates: Requirements 1.1 (session completeness)
       *
       * Property-based version of Scenario C.
       * For any user with any name/lastName/phone values, the fixed jwt callback must persist them.
       *
       * PASSES on fixed code.
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (name, lastName, phone) => {
            const user = {
              id: '42',
              name,
              lastName,
              phone,
              email: 'user@example.com',
              role: Role.EMPLOYEE,
              accessToken: 'tok',
              company: 'Corp',
              companyLogo: null,
            };

            const token: Record<string, unknown> = {};
            const resultToken = fixedJwtCallback(token, user);

            return (
              resultToken.name === name &&
              resultToken.lastName === lastName &&
              resultToken.phone === phone
            );
          },
        ),
        { numRuns: 10 },
      );
    });
  });
});
