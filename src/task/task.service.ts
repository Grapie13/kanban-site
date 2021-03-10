import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from '../auth/auth.service';
import { Repository } from 'typeorm';
import { Task } from '../entities/Task.entity';
import { TaskDto } from './dto/task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly authService: AuthService,
  ) {}

  async findById(id: number): Promise<Task> {
    const task = await this.taskRepository.findOne(
      { id },
      {
        relations: ['user'],
      },
    );
    task.user.password = undefined;
    return task;
  }

  async createTask(taskInfo: TaskDto): Promise<Task> {
    const user = await this.authService.findByUsername(taskInfo.username);
    const task = new Task();
    task.name = taskInfo.name;
    task.stage = taskInfo.stage;
    task.user = user;
    task.user.password = undefined;
    return this.taskRepository.save(task);
  }

  async updateTask(taskInfo: TaskDto): Promise<Task> {
    let task = await this.findById(taskInfo.id);
    task.name = taskInfo.name ?? task.name;
    task.stage = taskInfo.stage ?? task.stage;
    task.updatedAt = new Date();
    task = await this.taskRepository.save(task);
    return task;
  }

  async deleteTask(id: number): Promise<void> {
    await this.taskRepository.delete({ id });
  }
}
