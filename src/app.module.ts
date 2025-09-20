import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { EventsModule } from './modules/events/events.module';
import { EventRegistrationsModule } from './modules/event-registrations/event-registrations.module';
import { HomepagesModule } from './modules/homepages/homepages.module';
import { HomepageSectionsModule } from './modules/homepage-sections/homepage-sections.module';
import { UploadModule } from './modules/upload/upload.module';
import { ImageModule } from './modules/image/image.module';
import { NewsModule } from './modules/news/news.module';
import { CommentsModule } from './modules/comments/comments.module';
import { GalleryImagesModule } from './modules/gallery-images/gallery-images.module';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    PrismaModule,
    EventsModule,
    EventRegistrationsModule,
    HomepagesModule,
    HomepageSectionsModule,
    UploadModule,
    ImageModule,
    NewsModule,
    CommentsModule,
    GalleryImagesModule,
    EmailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
