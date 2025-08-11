import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { PrismaService } from './modules/prisma/prisma.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Prisma shutdown hooks
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN')?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger (disabled in production)
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('VSM API')
      .setDescription('Vietnam Student Marathon API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('posts', 'Blog posts and articles')
      .addTag('events', 'Running events')
      .addTag('products', 'Shop products')
      .addTag('comments', 'Post comments')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Static files
  app.use('/image', express.static(join(__dirname, '..', 'public', 'image')));

  const port = Number(process.env.PORT || configService.get('PORT') || 3000);
  logger.log(`Attempting to bind to port ${port} on 0.0.0.0`);
  await app.listen(port, '0.0.0.0', () => {
    logger.log(`Server successfully bound to port ${port}`);
  });

  logger.log(`🚀 VSM API Server running on port ${port}`);
  if (configService.get('NODE_ENV') !== 'production') {
    logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }
  logger.log(`🔍 Debug logs enabled for troubleshooting`);
}

bootstrap();