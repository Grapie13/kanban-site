import { CACHE_MANAGER } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
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
  let cacheManager: Cache;

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
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUsername', () => {
    it('searches for the user in the cache and the database, if the user is not cached', async () => {
      const returnedUser = await service.findByUsername('Tester');
      expect(returnedUser.username).toEqual(user.username);
      expect(cacheManager.get).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
      expect(repository.findOne).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('saves a user in the database and then caches it', async () => {
      const createdUser = await service.createUser({
        username: user.username,
        password: user.password,
      });
      expect(createdUser.username).toEqual(user.username);
      expect(repository.save).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('deletes a user from the database and the cache', async () => {
      await service.deleteUser(user.username);
      expect(cacheManager.del).toHaveBeenCalled();
      expect(repository.delete).toHaveBeenCalled();
    });
  });
});
