import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { readdirSync, unlinkSync } from 'fs';
import { v4 as uuid } from 'uuid';
import { env } from 'src/config/env';

@Controller('upload')
export class UploadController {
  @Post('logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const userId = (req.query as Record<string, string>).userId;
          const ext = extname(file.originalname);

          if (userId) {
            // Delete any previous logo for this user (may have different extension)
            const uploadsDir = join(process.cwd(), 'uploads');
            try {
              readdirSync(uploadsDir)
                .filter((f) => f.startsWith(`logo-${userId}.`))
                .forEach((f) => unlinkSync(join(uploadsDir, f)));
            } catch {
              // uploads dir may not exist yet on first run
            }
            cb(null, `logo-${userId}${ext}`);
          } else {
            cb(null, `${uuid()}${ext}`);
          }
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp|svg\+xml)$/)) {
          return cb(new BadRequestException('Solo se permiten imágenes'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Query('userId') _userId?: string,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const url = `${env.backendUrl}/uploads/${file.filename}`;
    return { url };
  }

  @Post('template-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          cb(null, `template-img-${uuid()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp|svg\+xml)$/)) {
          return cb(new BadRequestException('Solo se permiten imágenes'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadTemplateImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const url = `${env.backendUrl}/uploads/${file.filename}`;
    return { url };
  }
}
