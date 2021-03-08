import { CACHE_MANAGER, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { AuthService } from '../auth/auth.service';
import { Repository } from 'typeorm';
import { Task } from '../entities/Task.entity';
import { TaskDto } from './dto/task.dto';
import { User } from 'src/entities/User.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  async findById(id: number): Promise<Task> {
    let task = await this.getCachedTask(id);
    if (!task) {
      task = await this.taskRepository.findOne(
        { id },
        {
          relations: ['user'],
        },
      );
      if (task) {
        task.user.password = undefined;
        await this.cacheTask(task);
      }
    }
    return task;
  }

  async createTask(taskInfo: TaskDto): Promise<Task> {
    const user = await this.authService.findByUsername(taskInfo.username);
    let task = new Task();
    task.name = taskInfo.name;
    task.stage = taskInfo.stage;
    task.user = user;
    task.user.password = undefined;
    task = await this.taskRepository.save(task);
    await this.cacheTask(task);
    await this.authService.deleteUserCache(task.user.username);
    return task;
  }

  async updateTask(taskInfo: TaskDto): Promise<Task> {
    console.log(taskInfo);
    let task = await this.findById(taskInfo.id);
    console.log(task);
    task.name = taskInfo.name ?? task.name;
    task.stage = taskInfo.stage ?? task.stage;
    task.updatedAt = new Date();
    task = await this.taskRepository.save(task);
    await this.cacheTask(task);
    await this.authService.deleteUserCache(task.user.username);
    return task;
  }

  async deleteTask(id: number): Promise<void> {
    await this.deleteTaskCache(id);
    await this.taskRepository.delete({ id });
  }

  private getCachedTask(id: number): Promise<Task> {
    return this.cacheManager.get(`task:${id}`);
  }

  private async cacheTask(task: Task): Promise<void> {
    await this.cacheManager.set(`task:${task.id}`, task);
  }

  async deleteTaskCache(id: number): Promise<void> {
    await this.cacheManager.del(`task:${id}`);
  }

  async deleteUsersTaskCache(user: User): Promise<void> {
    for await (const task of user.tasks) {
      await this.cacheManager.del(`task:${task.id}`);
    }
  }
}
