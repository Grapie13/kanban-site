import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { JoiValidationPipe } from './pipes/joiValidation.pipe';
import { signupSchema } from './validation/signupSchema';
import * as jwt from 'jsonwebtoken';
import { UserExistsPipe } from './pipes/userExists.pipe';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UsePipes(new JoiValidationPipe(signupSchema), UserExistsPipe)
  async signup(@Body() authDto: AuthDto) {
    const user = await this.authService.createUser(authDto);
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
    );
    return {
      token,
    };
  }
}
