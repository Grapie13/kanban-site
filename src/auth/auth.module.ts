import { CacheModule, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/User.entity';
import { HelperModule } from 'src/helper/helper.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CacheModule.register({
      ttl: 3600,
      store: redisStore,
      host: process.env.CACHE_HOST,
      port: process.env.CACHE_PORT,
    }),
    HelperModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
