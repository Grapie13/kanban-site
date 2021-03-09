import { forwardRef, Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../entities/Task.entity';
import { CacheConfigModule } from '../cache-config/cache-config.module';
import { AuthModule } from '../auth/auth.module';
import { HelperModule } from '../helper/helper.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    CacheConfigModule,
    forwardRef(() => AuthModule),
    HelperModule,
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
