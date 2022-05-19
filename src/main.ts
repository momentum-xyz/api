import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appPrefix = '/api/v3/backend';

  if (process.env.DEPLOYMENT_BASE_URL === 'http://localhost') {
    app.enableCors();
  }

  app.setGlobalPrefix(appPrefix);
  app.useGlobalPipes(new ValidationPipe());

  Sentry.init({
    dsn: 'https://2195c57248c14a71ae20e358d93ec001@o572058.ingest.sentry.io/5721318',
    environment: getEnvironment(),
    tracesSampleRate: 1.0,
  });

  const config = new DocumentBuilder()
    .setTitle('Space Service')
    .setDescription('')
    .setVersion('0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(appPrefix + '/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  await app.listen(4000);
}

function getEnvironment(): string {
  const subStr: string[] = process.env.DEPLOYMENT_BASE_URL.match(/(?:http:\/\/)?(?:([^.]+))?/);

  const subStr2: string = subStr[1].replace('https://', '');
  return subStr2.replace('/', '');
}

bootstrap();
