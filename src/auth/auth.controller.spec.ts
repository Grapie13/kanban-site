import { Test, TestingModule } from '@nestjs/testing';
import { HelperService } from '../helper/helper.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../entities/User.entity';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserDto } from './dto/user.dto';

const user = new User();
user.id = 1;
user.username = 'Tester';
user.password = 'password';
user.createdAt = new Date();

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            findByUsername: jest.fn().mockImplementation((username: string) => {
              return new Promise((resolve) => {
                if (username === user.username) {
                  return resolve(user);
                }
                resolve(null);
              });
            }),
            createUser: jest.fn().mockImplementation((userDto: UserDto) => {
              return new Promise((resolve) => {
                const returnedUser = new User();
                returnedUser.id = 2;
                returnedUser.username = userDto.username;
                returnedUser.password = userDto.password;
                returnedUser.createdAt = new Date();
                resolve(returnedUser);
              });
            }),
            deleteUser: jest.fn(),
          },
        },
        {
          provide: HelperService,
          useValue: {
            verifyPassword: jest
              .fn()
              .mockImplementation(
                (password: string, hashedPassword: string) => {
                  return new Promise((resolve) => {
                    if (password === hashedPassword) {
                      return resolve(true);
                    }
                    resolve(false);
                  });
                },
              ),
            signJWT: jest.fn().mockReturnValue('randomtoken'),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUser', () => {
    it('throws an error if the user is not found', async (done) => {
      try {
        await controller.getUser('NotInDatabase');
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        done();
      }
    });

    it('finds a user in the database, hides its password and returns it', async () => {
      const res = await controller.getUser('Tester');
      expect(res.user.username).toEqual(user.username);
      expect(res.user.password).toBeUndefined();
    });
  });

  describe('signup', () => {
    it('throws an error if a user with that username already exists', async (done) => {
      try {
        await controller.signup({
          username: user.username,
          password: user.password,
        });
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        done();
      }
    });

    it('creates a new user, hides its password and returns it along with a token', async () => {
      const res = await controller.signup({
        username: 'NewUser',
        password: 'password',
      });
      expect(res.token).toBeDefined();
      expect(res.user).toBeDefined();
      expect(res.user.username).toEqual('NewUser');
      expect(res.user.password).toBeUndefined();
    });
  });

  describe('signin', () => {
    it('throws an error if the user does not exist', async (done) => {
      try {
        await controller.signin({
          username: 'NotInDatabase',
          password: user.password,
        });
      } catch (err) {
        expect(err).toBeInstanceOf(UnauthorizedException);
        done();
      }
    });

    it('throws an error if the password is incorrect', async (done) => {
      try {
        await controller.signin({
          username: user.username,
          password: 'BadPassword',
        });
      } catch (err) {
        expect(err).toBeInstanceOf(UnauthorizedException);
        done();
      }
    });

    it('returns a token and user details (without the password) if everything is correct', async () => {
      const res = await controller.signin({
        username: user.username,
        password: user.password,
      });
      expect(res.token).toBeDefined();
      expect(res.user).toBeDefined();
      expect(res.user.username).toEqual(user.username);
      expect(res.user.password).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('throws an error if a user does not exist', async (done) => {
      try {
        await controller.delete({ username: 'NotInDatabase' });
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        done();
      }
    });

    it('deletes a user', async () => {
      await controller.delete({ username: user.username });
      expect(service.deleteUser).toHaveBeenCalled();
    });
  });
});
