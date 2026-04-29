/**
 * Preservation Property Tests
 *
 * Property 3: Preservation — Unchanged Behavior for Non-Bug-Condition Inputs
 *
 * These tests MUST PASS on unfixed code — they capture baseline behavior that
 * must be preserved after the fix is applied.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 *
 * Non-bug-condition inputs (isBugCondition(X) = false):
 *   - SUPERVISOR creator → EMPLOYEE inherits company/companyLogo from SUPERVISOR
 *   - EMPLOYEE creator → throws ForbiddenException (permissions error)
 *   - SUPERVISOR creator with non-EMPLOYEE role → throws ForbiddenException
 *   - AuthService.register() without companyLogo → user created with companyLogo: null, no error
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as fc from 'fast-check';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { PasswordService } from 'src/user/password/password.service';
import { PrismaService } from 'src/Database/prisma.service';
import { Role } from 'src/enum/Roles';
import { User } from 'src/generated/prisma/client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a minimal mock SUPERVISOR User object */
function makeSupervisor(overrides: Partial<User> = {}): User {
  return {
    id: 2,
    name: 'Bob',
    lastName: 'Jones',
    phone: '555-0002',
    email: 'bob@acme.com',
    password: 'hashed',
    role: Role.SUPERVISOR,
    ownerId: 1,
    company: 'Acme',
    companyLogo: 'https://acme.com/logo.png',
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

/** Builds a minimal mock EMPLOYEE User object */
function makeEmployee(overrides: Partial<User> = {}): User {
  return {
    id: 3,
    name: 'Carol',
    lastName: 'White',
    phone: '555-0003',
    email: 'carol@acme.com',
    password: 'hashed',
    role: Role.EMPLOYEE,
    ownerId: 1,
    company: 'Acme',
    companyLogo: 'https://acme.com/logo.png',
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('Preservation — Unchanged Behavior for Non-Bug-Condition Inputs', () => {
  let authService: AuthService;
  let userService: UserService;
  let mockPrismaCreate: jest.Mock;
  let mockPrismaFindFirst: jest.Mock;
  let mockPasswordHash: jest.Mock;

  beforeEach(async () => {
    mockPrismaCreate = jest.fn().mockImplementation((args: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 99, ...args.data }),
    );
    mockPrismaFindFirst = jest.fn().mockResolvedValue(null);
    mockPasswordHash = jest.fn().mockResolvedValue('hashed_password');

    const mockPrismaService = {
      user: {
        findFirst: mockPrismaFindFirst,
        findUnique: jest.fn().mockResolvedValue(null),
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
  // Requirement 3.1 — SUPERVISOR creates EMPLOYEE: company/companyLogo inherited
  // -------------------------------------------------------------------------
  describe('Requirement 3.1 — SUPERVISOR creates EMPLOYEE: company/companyLogo must be inherited', () => {
    /**
     * Validates: Requirements 3.1
     *
     * isBugCondition(X) = false because creatorRole = SUPERVISOR (not OWNER).
     * This behavior already works correctly and must continue to work after the fix.
     */

    it('concrete case: SUPERVISOR with company="Acme" creates EMPLOYEE → EMPLOYEE inherits company', async () => {
      const supervisorCreator = makeSupervisor({
        company: 'Acme',
        companyLogo: 'https://acme.com/logo.png',
      });

      await userService.createUser(supervisorCreator, {
        name: 'Dave',
        lastName: 'Brown',
        phone: '555-0004',
        email: 'dave@acme.com',
        password: 'secret',
        role: Role.EMPLOYEE,
        ownerId: null,
      });

      const callArgs = mockPrismaCreate.mock.calls[0][0];
      const dataPassedToPrisma = callArgs.data;

      expect(dataPassedToPrisma.company).toBe('Acme');
      expect(dataPassedToPrisma.companyLogo).toBe('https://acme.com/logo.png');
    });

    it('concrete case: SUPERVISOR with companyLogo=null creates EMPLOYEE → EMPLOYEE inherits null companyLogo', async () => {
      const supervisorCreator = makeSupervisor({
        company: 'Acme',
        companyLogo: null,
      });

      await userService.createUser(supervisorCreator, {
        name: 'Eve',
        lastName: 'Green',
        phone: '555-0005',
        email: 'eve@acme.com',
        password: 'secret',
        role: Role.EMPLOYEE,
        ownerId: null,
      });

      const callArgs = mockPrismaCreate.mock.calls[0][0];
      const dataPassedToPrisma = callArgs.data;

      expect(dataPassedToPrisma.company).toBe('Acme');
      // companyLogo: null → creator.companyLogo! is null, so it's passed as null
      expect(dataPassedToPrisma.companyLogo).toBeNull();
    });

    it('property: for all SUPERVISOR creators with any company/companyLogo, EMPLOYEE always inherits exactly those values', async () => {
      /**
       * Validates: Requirements 3.1
       *
       * Property-based version: for any SUPERVISOR with any company/companyLogo values,
       * the created EMPLOYEE must inherit exactly those values.
       *
       * MUST PASS on unfixed code (this behavior already works correctly).
       */
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.option(fc.webUrl(), { nil: null }),
          async (company, companyLogo) => {
            mockPrismaCreate.mockClear();

            const supervisorCreator = makeSupervisor({ company, companyLogo });

            await userService.createUser(supervisorCreator, {
              name: 'Sub',
              lastName: 'User',
              phone: '555-9999',
              email: `sub-${Date.now()}-${Math.random()}@example.com`,
              password: 'pass',
              role: Role.EMPLOYEE,
              ownerId: null,
            });

            const callArgs = mockPrismaCreate.mock.calls[mockPrismaCreate.mock.calls.length - 1][0];
            const dataPassedToPrisma = callArgs.data;

            return (
              dataPassedToPrisma.company === company &&
              dataPassedToPrisma.companyLogo === companyLogo
            );
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Requirement 3.3 — EMPLOYEE creator: always rejected with permissions error
  // -------------------------------------------------------------------------
  describe('Requirement 3.3 — EMPLOYEE creator: operation always rejected with permissions error', () => {
    /**
     * Validates: Requirements 3.3
     *
     * isBugCondition(X) = false because creatorRole = EMPLOYEE (not OWNER).
     * EMPLOYEE cannot create users — this must continue to be rejected after the fix.
     */

    it('concrete case: EMPLOYEE attempts to create EMPLOYEE → throws permissions error', async () => {
      const employeeCreator = makeEmployee();

      await expect(
        userService.createUser(employeeCreator, {
          name: 'Frank',
          lastName: 'Black',
          phone: '555-0006',
          email: 'frank@acme.com',
          password: 'secret',
          role: Role.EMPLOYEE,
          ownerId: null,
        }),
      ).rejects.toThrow('No tenés permisos para crear usuarios');
    });

    it('property: for all EMPLOYEE creators, createUser always throws a permissions error', async () => {
      /**
       * Validates: Requirements 3.3
       *
       * Property-based version: for any EMPLOYEE creator with any target role,
       * the operation must always be rejected.
       *
       * MUST PASS on unfixed code.
       */
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(Role.EMPLOYEE, Role.SUPERVISOR, Role.OWNER),
          async (targetRole) => {
            const employeeCreator = makeEmployee();

            let threw = false;
            try {
              await userService.createUser(employeeCreator, {
                name: 'Target',
                lastName: 'User',
                phone: '555-0000',
                email: `target-${Date.now()}-${Math.random()}@example.com`,
                password: 'pass',
                role: targetRole,
                ownerId: null,
              });
            } catch {
              threw = true;
            }

            return threw;
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Requirement 3.4 — SUPERVISOR creating non-EMPLOYEE role: always rejected
  // -------------------------------------------------------------------------
  describe('Requirement 3.4 — SUPERVISOR creating non-EMPLOYEE role: always rejected', () => {
    /**
     * Validates: Requirements 3.4
     *
     * isBugCondition(X) = false because creatorRole = SUPERVISOR (not OWNER).
     * SUPERVISOR can only create EMPLOYEE — attempts to create other roles must be rejected.
     */

    it('concrete case: SUPERVISOR attempts to create SUPERVISOR → throws permissions error', async () => {
      const supervisorCreator = makeSupervisor();

      await expect(
        userService.createUser(supervisorCreator, {
          name: 'Grace',
          lastName: 'Hall',
          phone: '555-0007',
          email: 'grace@acme.com',
          password: 'secret',
          role: Role.SUPERVISOR,
          ownerId: null,
        }),
      ).rejects.toThrow('Un supervisor solo puede crear empleados');
    });

    it('concrete case: SUPERVISOR attempts to create OWNER → throws permissions error', async () => {
      const supervisorCreator = makeSupervisor();

      await expect(
        userService.createUser(supervisorCreator, {
          name: 'Henry',
          lastName: 'King',
          phone: '555-0008',
          email: 'henry@acme.com',
          password: 'secret',
          role: Role.OWNER,
          ownerId: null,
        }),
      ).rejects.toThrow('Un supervisor solo puede crear empleados');
    });

    it('property: for all SUPERVISOR creators attempting non-EMPLOYEE roles, always rejected', async () => {
      /**
       * Validates: Requirements 3.4
       *
       * Property-based version: for any SUPERVISOR creator attempting to create
       * a non-EMPLOYEE role, the operation must always be rejected.
       *
       * MUST PASS on unfixed code.
       */
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(Role.SUPERVISOR, Role.OWNER),
          async (nonEmployeeRole) => {
            const supervisorCreator = makeSupervisor();

            let threw = false;
            try {
              await userService.createUser(supervisorCreator, {
                name: 'Target',
                lastName: 'User',
                phone: '555-0000',
                email: `target-${Date.now()}-${Math.random()}@example.com`,
                password: 'pass',
                role: nonEmployeeRole,
                ownerId: null,
              });
            } catch {
              threw = true;
            }

            return threw;
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Requirement 3.2 — OWNER registration without companyLogo: succeeds with companyLogo: null
  // -------------------------------------------------------------------------
  describe('Requirement 3.2 — OWNER registration without companyLogo: always succeeds with companyLogo: null', () => {
    /**
     * Validates: Requirements 3.2
     *
     * isBugCondition(X) = false because sentCompany is null/empty (Scenario A condition not met).
     * Registering without companyLogo must continue to work without errors after the fix.
     *
     * NOTE: companyLogo is optional in RegisterDto. When not provided, the user must be
     * created with companyLogo: null (or undefined, which Prisma treats as null).
     */

    it('concrete case: register without companyLogo → succeeds and companyLogo is null/undefined', async () => {
      await expect(
        authService.register({
          name: 'Ivan',
          lastName: 'Lee',
          phone: '555-0009',
          email: 'ivan@example.com',
          password: 'secret',
        } as any),
      ).resolves.not.toThrow();

      const callArgs = mockPrismaCreate.mock.calls[0][0];
      const dataPassedToPrisma = callArgs.data;

      // companyLogo was not provided — must be null or undefined (not an error)
      expect(dataPassedToPrisma.companyLogo == null).toBe(true);
    });

    it('property: for all OWNER registrations without companyLogo, always succeeds with companyLogo: null', async () => {
      /**
       * Validates: Requirements 3.2
       *
       * Property-based version: for any OWNER registration without companyLogo,
       * the operation must always succeed and companyLogo must be null/undefined.
       *
       * MUST PASS on unfixed code.
       */
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.emailAddress(),
          async (name, lastName, phone, email) => {
            mockPrismaCreate.mockClear();
            mockPrismaFindFirst.mockResolvedValue(null);

            let succeeded = false;
            let companyLogoIsNull = false;

            try {
              await authService.register({
                name,
                lastName,
                phone,
                email,
                password: 'password123',
              } as any);

              succeeded = true;

              const callArgs = mockPrismaCreate.mock.calls[mockPrismaCreate.mock.calls.length - 1][0];
              const dataPassedToPrisma = callArgs.data;
              companyLogoIsNull = dataPassedToPrisma.companyLogo == null;
            } catch {
              succeeded = false;
            }

            return succeeded && companyLogoIsNull;
          },
        ),
        { numRuns: 15 },
      );
    });
  });
});
