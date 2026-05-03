import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/Database/prisma.service';
import { CreateTemplateDto } from './dto/template.dto';
import { AuthUser } from 'src/common/decorators/user.decorator';

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

  async delete(id: number, user: AuthUser) {
    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new ForbiddenException('Template not found');
    }

    // Verificar que el template pertenece al usuario o a su tenant
    const allowedUserId = user.role === 'OWNER' ? user.id : user.ownerId;
    if (template.userId !== user.id && template.userId !== allowedUserId) {
      throw new ForbiddenException('No tenés permisos para eliminar este template');
    }

    return this.prisma.template.delete({
      where: { id },
    });
  }

  async update(id: string) {
    return this.prisma.template.update({
      where: { id: Number(id) },
      data: {
        title: 'Updated Template',
        content: 'This is the updated content of the template.',
      },
    });
  }
}
