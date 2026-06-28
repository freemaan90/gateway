import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WhatsappSenderController } from './whatsapp-sender.controller';
import { MetaApiService } from './meta-api.service';
import { BulkSendService } from './bulk-send.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/RolesGuard';
import { SubscriptionGuard } from 'src/common/guards/subscription.guard';

const mockMetaApiService = {
  getStatus: jest.fn(),
  sendTextMessage: jest.fn(),
};

const mockBulkSendService = {
  createJob: jest.fn(),
  getJob: jest.fn(),
};

const mockUser = { id: 1, email: 'test@test.com', role: 'OWNER' };

async function buildController() {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [WhatsappSenderController],
    providers: [
      { provide: MetaApiService, useValue: mockMetaApiService },
      { provide: BulkSendService, useValue: mockBulkSendService },
    ],
  })
    .overrideGuard(JwtGuard).useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
    .overrideGuard(SubscriptionGuard).useValue({ canActivate: () => true })
    .compile();

  return module.get<WhatsappSenderController>(WhatsappSenderController);
}

describe('WhatsappSenderController', () => {
  let controller: WhatsappSenderController;

  beforeEach(async () => {
    jest.clearAllMocks();
    controller = await buildController();
  });

  describe('getStatus', () => {
    it('returns MetaApiService status', () => {
      const status = { connected: true, phoneNumberId: '1234567890' };
      mockMetaApiService.getStatus.mockReturnValue(status);

      const result = controller.getStatus();

      expect(mockMetaApiService.getStatus).toHaveBeenCalled();
      expect(result).toEqual(status);
    });
  });

  describe('sendMessage', () => {
    it('delegates to MetaApiService.sendTextMessage', async () => {
      const messageId = { messageId: 'wamid.abc123' };
      mockMetaApiService.sendTextMessage.mockResolvedValue(messageId);

      const result = await controller.sendMessage({ phone: '5491112345678', message: 'Hola' });

      expect(mockMetaApiService.sendTextMessage).toHaveBeenCalledWith('5491112345678', 'Hola');
      expect(result).toEqual(messageId);
    });

    it('propagates errors from MetaApiService', async () => {
      mockMetaApiService.sendTextMessage.mockRejectedValue(new Error('Meta API error 400'));

      await expect(
        controller.sendMessage({ phone: '5491112345678', message: 'Hola' }),
      ).rejects.toThrow('Meta API error 400');
    });
  });

  describe('bulkSend', () => {
    it('creates a job and returns jobId', async () => {
      mockBulkSendService.createJob.mockReturnValue('job-uuid');
      const body = {
        messages: [{ phone: '5491112345678', message: 'Hola' }],
        templateTitle: 'promo',
      };

      const result = await controller.bulkSend(body, mockUser as any);

      expect(mockBulkSendService.createJob).toHaveBeenCalledWith(
        body.messages,
        mockUser.id,
        body.templateTitle,
      );
      expect(result).toEqual({ jobId: 'job-uuid' });
    });
  });

  describe('getBulkSendStatus', () => {
    it('returns job status', async () => {
      const job = { jobId: 'job-uuid', status: 'done', total: 1, done: 1, failed: [] };
      mockBulkSendService.getJob.mockReturnValue(job);

      const result = await controller.getBulkSendStatus('job-uuid');

      expect(result).toEqual(job);
    });

    it('throws NotFoundException for unknown jobId', async () => {
      mockBulkSendService.getJob.mockReturnValue(undefined);

      await expect(controller.getBulkSendStatus('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
