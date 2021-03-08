import { ForbiddenException } from '@nestjs/common';
import { AuthorizationPipe } from './authorization.pipe';
import { HelperService } from '../../helper/helper.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDto } from '../dto/user.dto';

const testToken = 'testToken';
const user: UserDto = {
  username: 'Tester',
};

describe('AuthorizationPipe', () => {
  let pipe: AuthorizationPipe;
  let helperService: HelperService;

  beforeEach(async () => {
    const helperModule: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: HelperService,
          useValue: {
            verifyJWT: jest.fn().mockImplementation((token: string) => {
              if (token === testToken) {
                return {
                  id: 1,
                  username: user.username,
                };
              }
            }),
          },
        },
      ],
    }).compile();
    helperService = helperModule.get<HelperService>(HelperService);
    pipe = new AuthorizationPipe(helperService);
  });

  describe('successful calls', () => {
    it('checks if the token is correct and sets its username parameters to the username inside the payload', () => {
      const returnedDto = pipe.transform({ token: testToken });
      expect(returnedDto.username).toEqual(user.username);
      expect(helperService.verifyJWT).toHaveBeenCalled();
    });
  });

  describe('failed calls', () => {
    it('throws an error if the token is invalid', () => {
      const errorPipe = () => pipe.transform({ token: 'badToken' });
      expect(errorPipe).toThrowError(ForbiddenException);
      expect(errorPipe).toThrowError(
        'You are not authorized to access this route',
      );
    });
  });
});
