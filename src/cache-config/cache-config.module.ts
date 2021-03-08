import { CacheModule, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      ttl: 3600,
      store: redisStore,
      host: process.env.CACHE_HOST,
      port: process.env.CACHE_PORT,
    }),
  ],
  exports: [CacheModule],
})
export class CacheConfigModule {}
