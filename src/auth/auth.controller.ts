import {
  Controller,
  Post,
  Body,
  UsePipes,
  Delete,
  NotFoundException,
  BadRequestException,
  HttpCode,
  Get,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDto } from './dto/user.dto';
import { JoiValidationPipe } from '../pipes/joiValidation.pipe';
import { signupSchema } from '../validation/signupSchema';
import { AuthorizationPipe } from '../pipes/authorization.pipe';
import { HelperService } from '../helper/helper.service';

@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly helperService: HelperService,
  ) {}

  @Get('user/:username')
  async getUser(@Param('username') username: string) {
    const user = await this.authService.findByUsername(username);
    if (!user) {
      throw new NotFoundException('No user with that username exists');
    }
    user.password = undefined; // Hide password from the receiver
    return { user };
  }

  @Post('signup')
  @UsePipes(new JoiValidationPipe(signupSchema))
  async signup(@Body() userDto: UserDto) {
    let user = await this.authService.findByUsername(userDto.username);
    if (user) {
      throw new BadRequestException('A user with this username already exists');
    }
    user = await this.authService.createUser(userDto);
    user.password = undefined; // Hide password from the receiver
    return {
      token: this.helperService.signJWT({
        id: user.id,
        username: user.username,
      }),
      user,
    };
  }

  @Post('signin')
  @HttpCode(200)
  async signin(@Body() userDto: UserDto) {
    const user = await this.authService.findByUsername(userDto.username);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }
    const verifiedPassword = await this.helperService.verifyPassword(
      userDto.password,
      user.password,
    );
    if (!verifiedPassword) {
      throw new UnauthorizedException('Invalid username or password');
    }
    user.password = undefined; // Hide password from the receiver
    return {
      token: this.helperService.signJWT({
        id: user.id,
        username: user.username,
      }),
      user,
    };
  }

  @Delete('deleteuser')
  async delete(@Body(AuthorizationPipe) userDto: UserDto) {
    const user = await this.authService.findByUsername(userDto.username);
    if (!user) {
      throw new NotFoundException('There is no user bound to this token');
    }
    await this.authService.deleteUser(userDto.username);
    return {};
  }
}
