import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/Database/prisma.service';
import { CreateTemplateDto } from './dto/template.dto';

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) {}

  async findAll(id: string) {
    return this.prisma.template.findMany({
      where: {
        userId: Number(id),
      },
    });
  }

  async create(data: CreateTemplateDto) {
    return this.prisma.template.create({
      data: {
        title: data.title,
        content: data.content,
        userId: Number(data.userId),
      },
    });
  }
}
