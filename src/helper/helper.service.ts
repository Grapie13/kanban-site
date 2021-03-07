import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { JWTPayload } from './dto/jwtPayload.dto';

@Injectable()
export class HelperService {
  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 15);
  }

  verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  signJWT(payload: JWTPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
  }

  verifyJWT(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
}
