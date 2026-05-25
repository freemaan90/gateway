import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/Database/prisma.service';

interface CreateCampaignData {
  sessionId: string;
  total: number;
  sent: number;
  failed: number;
  failedDetails: { phone: string; error: string }[];
  userId: number;
  finishedAt: Date;
}

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCampaignData) {
    return this.prisma.campaign.create({
      data: {
        sessionId: data.sessionId,
        total: data.total,
        sent: data.sent,
        failed: data.failed,
        failedDetails: data.failedDetails as object[],
        userId: data.userId,
        finishedAt: data.finishedAt,
      },
    });
  }

  async findByOwner(ownerId: number) {
    return this.prisma.campaign.findMany({
      where: {
        user: {
          OR: [{ id: ownerId }, { ownerId: ownerId }],
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }
}
