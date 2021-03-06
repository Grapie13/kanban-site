import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AuthDto } from '../dto/auth.dto';

@Injectable()
export class UserExistsPipe implements PipeTransform {
  constructor(private authService: AuthService) {}

  async transform(value: AuthDto) {
    const user = await this.authService.findByUsername(value.username);
    if (user) {
      throw new BadRequestException('A user with that username already exists');
    }
    return value;
  }
}
