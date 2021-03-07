import { CACHE_MANAGER } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { HelperService } from '../helper/helper.service';
import { AuthService } from './auth.service';
import { User } from './entities/User.entity';

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
        HelperService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockResolvedValue(user),
            save: jest.fn(),
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

  it('tries to get the user from cache and if it does not exist then it searches it up in the database', async () => {
    const returnedUser = await service.findByUsername('Tester');
    expect(returnedUser.username).toEqual(user.username);
    expect(cacheManager.get).toHaveBeenCalled();
    expect(repository.findOne).toHaveBeenCalled();
  });
});
