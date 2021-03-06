import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import helmet from 'fastify-helmet';
import { envVariablesCheck } from './utils/envVariablesCheck';

async function bootstrap() {
  envVariablesCheck();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );
  app.register(helmet);
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
