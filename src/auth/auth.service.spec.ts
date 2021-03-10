import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HelperService } from '../helper/helper.service';
import { AuthService } from './auth.service';
import { User } from '../entities/User.entity';
import { TaskService } from '../task/task.service';

const user = new User();
user.id = 1;
user.username = 'Tester';
user.password = 'password';
user.createdAt = new Date();

describe('AuthService', () => {
  let service: AuthService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: HelperService,
          useValue: {
            hashPassword: jest.fn().mockResolvedValue(user.password),
          },
        },
        {
          provide: TaskService,
          useValue: {
            deleteUsersTaskCache: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockResolvedValue(user),
            save: jest.fn().mockResolvedValue(user),
            delete: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUsername', () => {
    it('should find the user', async () => {
      const returnedUser = await service.findByUsername('Tester');
      expect(returnedUser.username).toEqual(user.username);
      expect(repository.findOne).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('should save a user in the database', async () => {
      const createdUser = await service.createUser({
        username: user.username,
        password: user.password,
      });
      expect(createdUser.username).toEqual(user.username);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete a user from the database', async () => {
      await service.deleteUser(user.username);
      expect(repository.delete).toHaveBeenCalled();
    });
  });
});
