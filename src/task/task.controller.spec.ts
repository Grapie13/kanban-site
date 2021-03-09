import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HelperService } from '../helper/helper.service';
import { AuthService } from '../auth/auth.service';
import { TaskStage } from '../entities/Task.entity';
import { TaskDto } from './dto/task.dto';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

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

describe('TaskController', () => {
  let controller: TaskController;
  let taskService: TaskService;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: {
            findById: jest.fn().mockImplementation((id: number) => {
              return new Promise((resolve) => {
                if (id === task.id) {
                  return resolve(task);
                }
                resolve(null);
              });
            }),
            createTask: jest.fn().mockResolvedValue(task),
            updateTask: jest.fn().mockImplementation((taskDto: TaskDto) => {
              return new Promise((resolve) => {
                const updatedTask = task;
                updatedTask.name = taskDto.name ?? updatedTask.name;
                updatedTask.stage = taskDto.stage ?? updatedTask.stage;
                updatedTask.updatedAt = new Date();
                resolve(updatedTask);
              });
            }),
            deleteTask: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: AuthService,
          useValue: {
            findByUsername: jest.fn().mockImplementation((username: string) => {
              return new Promise((resolve) => {
                if (username === user.username) {
                  return resolve(user);
                }
                resolve({ ...user, username: 'NotTheOwner' });
              });
            }),
          },
        },
        {
          provide: HelperService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    taskService = module.get<TaskService>(TaskService);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('get', () => {
    it('should throw an error if a task does not exist in the database', async (done) => {
      try {
        await controller.get(2);
      } catch (err) {
        expect(err instanceof NotFoundException);
        expect(err.message).toEqual('No task with that ID exists');
        done();
      }
    });

    it('should find and return a task', async () => {
      const res = await controller.get(task.id);
      expect(res.task).toBeDefined();
      expect(res.task.name).toEqual(task.name);
      expect(taskService.findById).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a task', async () => {
      const res = await controller.create(taskDto);
      expect(res.task).toBeDefined();
      expect(res.task.name).toEqual(taskDto.name);
      expect(taskService.createTask).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should throw an error if a task does not exist', async (done) => {
      try {
        await controller.update(5, taskDto);
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect(err.message).toEqual('No task with that ID exists');
        done();
      }
    });

    it('should throw an error if the user trying to edit a task is not the owner', async (done) => {
      try {
        await controller.update(task.id, {
          ...taskDto,
          username: 'NotTheOwner',
        });
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.message).toEqual('You are not authorized to edit this task');
        done();
      }
    });

    it('should update the task', async () => {
      const res = await controller.update(task.id, {
        ...taskDto,
        name: 'Updated Task',
      });
      expect(res.task).toBeDefined();
      expect(res.task.name).toEqual('Updated Task');
      expect(taskService.updateTask).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should throw an error if the task is not found', async (done) => {
      try {
        await controller.delete(2, taskDto);
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect(err.message).toEqual('No task with that ID exists');
        done();
      }
    });

    it('should throw an error if the user trying to delete a task is not its owner', async (done) => {
      try {
        await controller.delete(task.id, {
          ...taskDto,
          username: 'NotTheOwner',
        });
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.message).toEqual(
          'You are not authorized to delete this task',
        );
        done();
      }
    });

    it('should delete the task', async () => {
      await controller.delete(task.id, taskDto);
      expect(authService.findByUsername).toHaveBeenCalled();
      expect(taskService.deleteTask).toHaveBeenCalled();
    });
  });
});
