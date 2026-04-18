import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import * as fc from 'fast-check';
import { WhatsappSenderController } from './whatsapp-sender.controller';
import { WHATSAPP_SENDER } from 'src/service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

// Helper to build a mock ClientProxy
function buildClientProxy(response?: unknown, shouldFail = false) {
  return {
    send: jest.fn().mockReturnValue(
      shouldFail
        ? throwError(() => new Error('connection refused'))
        : of(response),
    ),
  };
}

describe('WhatsappSenderController', () => {
  let controller: WhatsappSenderController;
  let clientProxy: ReturnType<typeof buildClientProxy>;

  async function createModule(proxy: ReturnType<typeof buildClientProxy>) {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsappSenderController],
      providers: [{ provide: WHATSAPP_SENDER, useValue: proxy }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    return module.get<WhatsappSenderController>(WhatsappSenderController);
  }

  beforeEach(async () => {
    clientProxy = buildClientProxy({ ok: true });
    controller = await createModule(clientProxy);
  });

  // ─── Unit tests ────────────────────────────────────────────────────────────

  describe('getSessions', () => {
    it('calls whatsapp_sender_sessions with empty payload', async () => {
      const mockResponse = [{ id: 'session1' }];
      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await controller.getSessions();

      expect(clientProxy.send).toHaveBeenCalledWith(
        { cmd: 'whatsapp_sender_sessions' },
        {},
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws ServiceUnavailableException when ClientProxy fails', async () => {
      clientProxy.send.mockReturnValue(
        throwError(() => new Error('connection refused')),
      );

      await expect(controller.getSessions()).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(controller.getSessions()).rejects.toMatchObject({
        response: { status: 'down', service: 'whatsapp-sender' },
      });
    });
  });

  describe('createSession', () => {
    it('calls whatsapp_sender_create_session with sessionId payload', async () => {
      const mockResponse = { sessionId: 'abc', status: 'created' };
      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await controller.createSession({ sessionId: 'abc' });

      expect(clientProxy.send).toHaveBeenCalledWith(
        { cmd: 'whatsapp_sender_create_session' },
        { sessionId: 'abc' },
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws ServiceUnavailableException when ClientProxy fails', async () => {
      clientProxy.send.mockReturnValue(
        throwError(() => new Error('connection refused')),
      );

      await expect(
        controller.createSession({ sessionId: 'abc' }),
      ).rejects.toThrow(ServiceUnavailableException);
      await expect(
        controller.createSession({ sessionId: 'abc' }),
      ).rejects.toMatchObject({
        response: { status: 'down', service: 'whatsapp-sender' },
      });
    });
  });

  describe('getSessionQr', () => {
    it('calls whatsapp_sender_qr with sessionId payload', async () => {
      const mockResponse = { qr: 'data:image/png;base64,...' };
      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await controller.getSessionQr('my-session');

      expect(clientProxy.send).toHaveBeenCalledWith(
        { cmd: 'whatsapp_sender_qr' },
        { sessionId: 'my-session' },
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws ServiceUnavailableException when ClientProxy fails', async () => {
      clientProxy.send.mockReturnValue(
        throwError(() => new Error('connection refused')),
      );

      await expect(controller.getSessionQr('my-session')).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(
        controller.getSessionQr('my-session'),
      ).rejects.toMatchObject({
        response: { status: 'down', service: 'whatsapp-sender' },
      });
    });
  });

  describe('getSessionStatus', () => {
    it('calls whatsapp_sender_session_status with sessionId payload', async () => {
      const mockResponse = { status: 'connected' };
      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await controller.getSessionStatus('my-session');

      expect(clientProxy.send).toHaveBeenCalledWith(
        { cmd: 'whatsapp_sender_session_status' },
        { sessionId: 'my-session' },
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws ServiceUnavailableException when ClientProxy fails', async () => {
      clientProxy.send.mockReturnValue(
        throwError(() => new Error('connection refused')),
      );

      await expect(controller.getSessionStatus('my-session')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('deleteSession', () => {
    it('calls whatsapp_sender_delete_session with sessionId payload', async () => {
      const mockResponse = { deleted: true };
      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await controller.deleteSession('my-session');

      expect(clientProxy.send).toHaveBeenCalledWith(
        { cmd: 'whatsapp_sender_delete_session' },
        { sessionId: 'my-session' },
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws ServiceUnavailableException when ClientProxy fails', async () => {
      clientProxy.send.mockReturnValue(
        throwError(() => new Error('connection refused')),
      );

      await expect(controller.deleteSession('my-session')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('sendMessage', () => {
    it('calls whatsapp_sender_send_message with full payload', async () => {
      const mockResponse = { sent: true };
      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await controller.sendMessage('my-session', {
        phone: '+1234567890',
        message: 'Hello',
      });

      expect(clientProxy.send).toHaveBeenCalledWith(
        { cmd: 'whatsapp_sender_send_message' },
        { sessionId: 'my-session', phone: '+1234567890', message: 'Hello' },
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws ServiceUnavailableException when ClientProxy fails', async () => {
      clientProxy.send.mockReturnValue(
        throwError(() => new Error('connection refused')),
      );

      await expect(
        controller.sendMessage('my-session', {
          phone: '+1234567890',
          message: 'Hello',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // ─── Property-based tests ──────────────────────────────────────────────────

  /**
   * Feature: gateway-whatsapp-integration
   * Property 1: Payload forwarding
   * Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1
   */
  describe('Property 1: Payload forwarding', () => {
    it('getSessions always sends whatsapp_sender_sessions with {}', async () => {
      await fc.assert(
        fc.asyncProperty(fc.anything(), async (mockResponse) => {
          const proxy = buildClientProxy(mockResponse);
          const ctrl = await createModule(proxy);

          await ctrl.getSessions();

          expect(proxy.send).toHaveBeenCalledWith(
            { cmd: 'whatsapp_sender_sessions' },
            {},
          );
        }),
        { numRuns: 50 },
      );
    });

    it('createSession always sends whatsapp_sender_create_session with { sessionId }', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.anything(),
          async (sessionId, mockResponse) => {
            const proxy = buildClientProxy(mockResponse);
            const ctrl = await createModule(proxy);

            await ctrl.createSession({ sessionId });

            expect(proxy.send).toHaveBeenCalledWith(
              { cmd: 'whatsapp_sender_create_session' },
              { sessionId },
            );
          },
        ),
        { numRuns: 50 },
      );
    });

    it('getSessionQr always sends whatsapp_sender_qr with { sessionId }', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.anything(),
          async (sessionId, mockResponse) => {
            const proxy = buildClientProxy(mockResponse);
            const ctrl = await createModule(proxy);

            await ctrl.getSessionQr(sessionId);

            expect(proxy.send).toHaveBeenCalledWith(
              { cmd: 'whatsapp_sender_qr' },
              { sessionId },
            );
          },
        ),
        { numRuns: 50 },
      );
    });

    it('getSessionStatus always sends whatsapp_sender_session_status with { sessionId }', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.anything(),
          async (sessionId, mockResponse) => {
            const proxy = buildClientProxy(mockResponse);
            const ctrl = await createModule(proxy);

            await ctrl.getSessionStatus(sessionId);

            expect(proxy.send).toHaveBeenCalledWith(
              { cmd: 'whatsapp_sender_session_status' },
              { sessionId },
            );
          },
        ),
        { numRuns: 50 },
      );
    });

    it('deleteSession always sends whatsapp_sender_delete_session with { sessionId }', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.anything(),
          async (sessionId, mockResponse) => {
            const proxy = buildClientProxy(mockResponse);
            const ctrl = await createModule(proxy);

            await ctrl.deleteSession(sessionId);

            expect(proxy.send).toHaveBeenCalledWith(
              { cmd: 'whatsapp_sender_delete_session' },
              { sessionId },
            );
          },
        ),
        { numRuns: 50 },
      );
    });

    it('sendMessage always sends whatsapp_sender_send_message with { sessionId, phone, message }', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.anything(),
          async (sessionId, phone, message, mockResponse) => {
            const proxy = buildClientProxy(mockResponse);
            const ctrl = await createModule(proxy);

            await ctrl.sendMessage(sessionId, { phone, message });

            expect(proxy.send).toHaveBeenCalledWith(
              { cmd: 'whatsapp_sender_send_message' },
              { sessionId, phone, message },
            );
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Feature: gateway-whatsapp-integration
   * Property 2: Response pass-through
   * Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2
   */
  describe('Property 2: Response pass-through', () => {
    it('getSessions returns microservice response unmodified', async () => {
      await fc.assert(
        fc.asyncProperty(fc.anything(), async (mockResponse) => {
          const proxy = buildClientProxy(mockResponse);
          const ctrl = await createModule(proxy);

          const result = await ctrl.getSessions();

          expect(result).toEqual(mockResponse);
        }),
        { numRuns: 50 },
      );
    });

    it('createSession returns microservice response unmodified', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.anything(),
          async (sessionId, mockResponse) => {
            const proxy = buildClientProxy(mockResponse);
            const ctrl = await createModule(proxy);

            const result = await ctrl.createSession({ sessionId });

            expect(result).toEqual(mockResponse);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('getSessionQr returns microservice response unmodified', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.anything(),
          async (sessionId, mockResponse) => {
            const proxy = buildClientProxy(mockResponse);
            const ctrl = await createModule(proxy);

            const result = await ctrl.getSessionQr(sessionId);

            expect(result).toEqual(mockResponse);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('getSessionStatus returns microservice response unmodified', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.anything(),
          async (sessionId, mockResponse) => {
            const proxy = buildClientProxy(mockResponse);
            const ctrl = await createModule(proxy);

            const result = await ctrl.getSessionStatus(sessionId);

            expect(result).toEqual(mockResponse);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('deleteSession returns microservice response unmodified', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.anything(),
          async (sessionId, mockResponse) => {
            const proxy = buildClientProxy(mockResponse);
            const ctrl = await createModule(proxy);

            const result = await ctrl.deleteSession(sessionId);

            expect(result).toEqual(mockResponse);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('sendMessage returns microservice response unmodified', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.anything(),
          async (sessionId, phone, message, mockResponse) => {
            const proxy = buildClientProxy(mockResponse);
            const ctrl = await createModule(proxy);

            const result = await ctrl.sendMessage(sessionId, { phone, message });

            expect(result).toEqual(mockResponse);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Feature: gateway-whatsapp-integration
   * Property 3: Service unavailable propagation
   * Validates: Requirements 1.3, 2.4, 3.3, 4.3, 5.3, 6.4
   */
  describe('Property 3: Service unavailable propagation', () => {
    type EndpointFn = (ctrl: WhatsappSenderController) => Promise<unknown>;

    const endpoints: Array<{ name: string; fn: EndpointFn }> = [
      { name: 'getSessions', fn: (c) => c.getSessions() },
      {
        name: 'createSession',
        fn: (c) => c.createSession({ sessionId: 'test' }),
      },
      { name: 'getSessionQr', fn: (c) => c.getSessionQr('test') },
      { name: 'getSessionStatus', fn: (c) => c.getSessionStatus('test') },
      { name: 'deleteSession', fn: (c) => c.deleteSession('test') },
      {
        name: 'sendMessage',
        fn: (c) =>
          c.sendMessage('test', { phone: '+1', message: 'hi' }),
      },
    ];

    it('all endpoints throw ServiceUnavailableException with correct body when ClientProxy fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...endpoints),
          async ({ fn }) => {
            const proxy = {
              send: jest
                .fn()
                .mockReturnValue(
                  throwError(() => new Error('connection refused')),
                ),
            };
            const ctrl = await createModule(proxy);

            await expect(fn(ctrl)).rejects.toThrow(ServiceUnavailableException);
            await expect(fn(ctrl)).rejects.toMatchObject({
              response: { status: 'down', service: 'whatsapp-sender' },
            });
          },
        ),
        { numRuns: 30 },
      );
    });
  });
});
