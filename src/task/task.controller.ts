import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  forwardRef,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { AuthorizationPipe } from 'src/pipes/authorization.pipe';
import { JoiValidationPipe } from 'src/pipes/joiValidation.pipe';
import { taskSchema } from 'src/validation/taskSchema';
import { TaskDto } from './dto/task.dto';
import { TaskService } from './task.service';

@Controller('v1/task')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  @Get('/:id')
  async get(@Param('id', ParseIntPipe) id: number) {
    const task = await this.taskService.findById(id);
    if (!task) {
      throw new NotFoundException('No task with that ID exists');
    }
    return {
      task,
    };
  }

  @Post()
  @UsePipes(new JoiValidationPipe(taskSchema))
  async create(@Body(AuthorizationPipe) taskInfo: TaskDto) {
    const task = await this.taskService.createTask(taskInfo);
    return { task };
  }

  @Patch('/:id')
  @UsePipes(new JoiValidationPipe(taskSchema))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(AuthorizationPipe) taskInfo: TaskDto,
  ) {
    let task = await this.taskService.findById(id);
    if (!task) {
      throw new NotFoundException('No task with that ID exists');
    }
    if (task.user.username !== taskInfo.username) {
      throw new ForbiddenException('You are not authorized to edit this task');
    }
    task = await this.taskService.updateTask({ id, ...taskInfo });
    return {
      task,
    };
  }

  @Delete('/:id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Body(AuthorizationPipe) taskInfo: TaskDto,
  ) {
    const user = await this.authService.findByUsername(taskInfo.username);
    const task = await this.taskService.findById(id);
    if (!task) {
      throw new NotFoundException('No task with that ID exists');
    }
    if (task.user.username !== user.username) {
      throw new ForbiddenException(
        'You are not authorized to delete this task',
      );
    }
    await this.taskService.deleteTask(task.id);
    return {};
  }
}
