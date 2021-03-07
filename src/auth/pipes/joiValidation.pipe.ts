import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ObjectSchema } from 'joi';
import { UserDto } from '../dto/user.dto';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private schema: ObjectSchema) {}

  transform(value: UserDto) {
    const { error } = this.schema.validate(value);
    if (error) {
      throw new BadRequestException(error.message);
    }
    return value;
  }
}
