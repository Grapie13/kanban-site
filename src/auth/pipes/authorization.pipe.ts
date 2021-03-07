import { ForbiddenException, Injectable, PipeTransform } from '@nestjs/common';
import { JWTPayload } from '../../helper/dto/jwtPayload.dto';
import { HelperService } from '../../helper/helper.service';
import { DeleteDto } from '../dto/delete.dto';

@Injectable()
export class AuthorizationPipe implements PipeTransform {
  constructor(private readonly helperService: HelperService) {}
  transform(value: DeleteDto) {
    try {
      const payload = this.helperService.verifyJWT(value.token);
      value.username = (<JWTPayload>payload).username;
      return value;
    } catch (err) {
      console.log(err);
      throw new ForbiddenException(
        'You are not authorized to access this route',
      );
    }
  }
}
