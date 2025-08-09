import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MulterModule.register({
      storage: memoryStorage(), // Use memory storage to get buffer for Supabase upload
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg\+xml)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  ],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}