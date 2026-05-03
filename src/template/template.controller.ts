import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { TemplateService } from './template.service';
import { CreateTemplateDto } from './dto/template.dto';
import { Roles } from 'src/common/decorators/Roles';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/RolesGuard';
import { User } from 'src/common/decorators/user.decorator';
import type { AuthUser } from 'src/common/decorators/user.decorator';

@Controller('template')
@UseGuards(JwtGuard, RolesGuard)
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get(`:id`)
  @Roles('OWNER', 'SUPERVISOR', 'EMPLOYEE')
  getTemplates(@Param('id') id: string) {
    return this.templateService.findAll(id);
  }

  @Post()
  @Roles('OWNER', 'SUPERVISOR')
  createTemplate(@Body() body: CreateTemplateDto) {
    return this.templateService.create(body);
  }

  @Delete(':id')
  @Roles('OWNER', 'SUPERVISOR')
  deleteTemplate(@Param('id') id: string, @User() user: AuthUser) {
    return this.templateService.delete(Number(id), user);
  }

  @Patch(`:id`)
  @Roles('OWNER', 'SUPERVISOR')
  updateTemplate(@Param('id') id: string) {
    return this.templateService.update(id);
  }
}
