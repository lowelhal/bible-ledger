import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const frontendUrl = process.env.FRONTEND_URL || '';

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, server-to-server)
      if (!origin) return callback(null, true);
      // Production origin from FRONTEND_URL env var
      if (frontendUrl && origin === frontendUrl) {
        return callback(null, true);
      }
      // Local development origins
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      // Reject unknown origins
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Bible Ledger API')
    .setDescription('A high-precision, event-sourced spiritual ledger.')
    .setVersion('1.4.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on port ${port}, FRONTEND_URL=${frontendUrl || '(not set)'}`);
}
bootstrap();
