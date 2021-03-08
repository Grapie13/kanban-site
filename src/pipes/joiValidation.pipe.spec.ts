import { BadRequestException } from '@nestjs/common';
import { JoiValidationPipe } from './joiValidation.pipe';
import { UserDto } from '../auth/dto/user.dto';
import { signupSchema } from '../validation/signupSchema';

const username = 'CorrectUsername',
  password = 'CorrectPassword';

describe('JoiValidationPipe', () => {
  let pipe: JoiValidationPipe;

  beforeEach(() => {
    pipe = new JoiValidationPipe(signupSchema);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('successful calls', () => {
    it('should let user DTO pass', () => {
      const userDTO: UserDto = {
        username,
        password,
      };
      expect(pipe.transform(userDTO)).toEqual(userDTO);
    });
  });

  describe('failed calls', () => {
    describe('username errors', () => {
      const badUserDTO: UserDto = {
        password,
      };

      it('should throw an error, because the username is missing', () => {
        const errorPipe = () => pipe.transform(badUserDTO);
        expect(errorPipe).toThrowError(BadRequestException);
        expect(errorPipe).toThrowError('Username is required');
      });

      it('should throw an error, because the username is too short', () => {
        badUserDTO.username = 'no';
        const errorPipe = () => pipe.transform(badUserDTO);
        expect(errorPipe).toThrowError(BadRequestException);
        expect(errorPipe).toThrowError(
          'Username has to be at least 3 characters long',
        );
      });

      it('should throw an error, because the username is too long', () => {
        badUserDTO.username =
          'verybadandverylongusernamewhichwillnotpassthistest';
        const errorPipe = () => pipe.transform(badUserDTO);
        expect(errorPipe).toThrowError(BadRequestException);
        expect(errorPipe).toThrowError('Username cannot exceed 20 characters');
      });
    });

    describe('password errors', () => {
      const badUserDTO: UserDto = {
        username,
      };

      it('should throw an error for missing password', () => {
        const errorPipe = () => pipe.transform(badUserDTO);
        expect(errorPipe).toThrowError(BadRequestException);
        expect(errorPipe).toThrowError('Password is required');
      });

      it('should throw an error, because the password is too short', () => {
        badUserDTO.password = 'short';
        const errorPipe = () => pipe.transform(badUserDTO);
        expect(errorPipe).toThrowError(BadRequestException);
        expect(errorPipe).toThrowError(
          'Password has to be at least 6 characters long',
        );
      });

      it('should throw an error, because the password is too long', () => {
        badUserDTO.password =
          'verybadandverylongpasswordwhichwillnotpassthistest';
        const errorPipe = () => pipe.transform(badUserDTO);
        expect(errorPipe).toThrowError(BadRequestException);
        expect(errorPipe).toThrowError('Password cannot exceed 30 characters');
      });
    });
  });
});
