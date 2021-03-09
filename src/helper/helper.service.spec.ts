import { Test, TestingModule } from '@nestjs/testing';
import { JWTPayload } from './dto/jwtPayload.dto';
import { HelperService } from './helper.service';

const password = 'password';
const payload: JWTPayload = {
  id: 1,
  username: 'Tester',
};

describe('HelperService', () => {
  let service: HelperService;

  beforeAll(() => {
    process.env.JWT_SECRET = 'testsecret';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HelperService],
    }).compile();
    service = module.get<HelperService>(HelperService);
  });

  describe('hashPassword', () => {
    it('should return a hashed password', async () => {
      const hashedPassword = await service.hashPassword(password);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toEqual(password);
    });
  });

  describe('verifyPassword', () => {
    it('should return true if the password matches the hashed password', async () => {
      const hashedPassword = await service.hashPassword(password);
      expect(await service.verifyPassword(password, hashedPassword)).toEqual(
        true,
      );
    });

    it('should return false if the password does not match the hashed password', async () => {
      const hashedPassword = await service.hashPassword('NotTheSamePassword');
      expect(await service.verifyPassword(password, hashedPassword)).toEqual(
        false,
      );
    });
  });

  describe('signJWT', () => {
    it('should sign a JWT token and return it', () => {
      const token = service.signJWT(payload);
      expect(token).toBeDefined();
      expect(token).toBeTruthy();
    });
  });

  describe('verifyJWT', () => {
    it('should throw an error if the token has an invalid signature', () => {
      process.env.JWT_SECRET = 'wrongsecret';
      const token = service.signJWT(payload);
      process.env.JWT_secret = 'testsecret';
      const tokenError = () => service.verifyJWT(token);
      expect(tokenError).toThrow('invalid signature');
    });

    it('should return an object with the payload if the token is valid', () => {
      const token = service.signJWT(payload);
      const returnedPayload = service.verifyJWT(token) as JWTPayload;
      expect(returnedPayload.id).toEqual(payload.id);
      expect(returnedPayload.username).toEqual(payload.username);
    });
  });
});
