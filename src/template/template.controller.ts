import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TemplateService } from './template.service';
import { Roles } from 'src/common/decorators/Roles';
import { CreateTemplateDto } from './dto/template.dto';

@Controller('template')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get(`:id`)
  @Roles('OWNER', 'SUPERVISOR', 'EMPLOYEE')
  getTemplates(@Param('id') id: string) {
    return this.templateService.findAll(id);
  }

  @Post()
  @Roles('OWNER', 'SUPERVISOR')
  createTemplate(
    @Body() body: CreateTemplateDto,
  ) {
    return this.templateService.create(body);
  }
}
