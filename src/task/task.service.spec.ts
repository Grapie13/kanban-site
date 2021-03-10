import { CACHE_MANAGER } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../auth/auth.service';
import { Repository } from 'typeorm';
import { Task, TaskStage } from '../entities/Task.entity';
import { TaskService } from './task.service';
import { TaskDto } from './dto/task.dto';

const user = {
  id: 1,
  username: 'Tester',
  password: 'password',
};
const task = {
  id: 1,
  name: 'Test task',
  stage: 'TODO',
  createdAt: new Date(),
  updatedAt: new Date(),
  user,
};
const taskDto: TaskDto = {
  id: 1,
  name: 'Test task',
  stage: TaskStage.TODO,
  token: 'token',
  username: 'Tester',
};

describe('TaskService', () => {
  let taskService: TaskService;
  let taskRepository: Repository<Task>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: AuthService,
          useValue: {
            findByUsername: jest.fn().mockResolvedValue(user),
            deleteUserCache: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: getRepositoryToken(Task),
          useValue: {
            findOne: jest.fn().mockResolvedValue(task),
            save: jest.fn().mockImplementation((receivedTask: Task) => {
              return new Promise((resolve) => {
                resolve(receivedTask);
              });
            }),
            delete: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            set: jest.fn(),
            get: jest.fn().mockResolvedValue(null),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    taskService = module.get<TaskService>(TaskService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(taskService).toBeDefined();
  });

  describe('findById', () => {
    it('should find a task', async () => {
      const foundTask = await taskService.findById(task.id);
      expect(foundTask.name).toEqual(task.name);
      expect(foundTask.user.password).toBeUndefined();
      expect(taskRepository.findOne).toHaveBeenCalled();
    });
  });

  describe('createTask', () => {
    it('should create a task', async () => {
      const createdTask = await taskService.createTask(taskDto);
      expect(createdTask.name).toEqual(taskDto.name);
      expect(taskRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('should update the task', async () => {
      const updatedTask = await taskService.updateTask({
        ...taskDto,
        name: 'Updated task',
      });
      expect(updatedTask.name).toEqual('Updated task');
      expect(updatedTask.updatedAt.toISOString()).not.toEqual(
        updatedTask.createdAt.toISOString(),
      );
      expect(taskRepository.save).toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('should delete the task', async () => {
      await taskService.deleteTask(task.id);
      expect(taskRepository.delete).toHaveBeenCalled();
    });
  });
});
