import { Controller, Get, Post } from '@nestjs/common';
import { TemplateService } from './template.service';
import { Roles } from 'src/common/decorators/Roles';

@Controller('template')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}
  @Get()
  @Roles('OWNER', 'SUPERVISOR', 'EMPLOYEE')
  getTemplates() {
    return this.templateService.findAll();
  }

  @Post()
  @Roles('OWNER', 'SUPERVISOR')
  createTemplate() {
    return this.templateService.create();
  }
}
