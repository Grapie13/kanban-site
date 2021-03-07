import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HelperModule } from './helper/helper.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `./env/.${process.env.NODE_ENV || 'development'}.env`,
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.TYPEORM_HOST,
      port: parseInt(process.env.TYPEORM_PORT),
      username: process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD,
      database: process.env.TYPEORM_DATABASE,
      synchronize: process.env.NODE_ENV !== 'production',
      autoLoadEntities: true,
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
    AuthModule,
    HelperModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
