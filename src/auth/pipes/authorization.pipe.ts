import { ForbiddenException, Injectable, PipeTransform } from '@nestjs/common';
import { JWTPayload } from '../../helper/dto/jwtPayload.dto';
import { HelperService } from '../../helper/helper.service';
import { UserDto } from '../dto/user.dto';

@Injectable()
export class AuthorizationPipe implements PipeTransform {
  constructor(private readonly helperService: HelperService) {}
  transform(value: UserDto) {
    try {
      const payload = this.helperService.verifyJWT(value.token) as JWTPayload;
      value.username = payload.username;
      return value;
    } catch (err) {
      throw new ForbiddenException(
        'You are not authorized to access this route',
      );
    }
  }
}
