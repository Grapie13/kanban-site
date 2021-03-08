import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ObjectSchema } from 'joi';
import { UserDto } from '../auth/dto/user.dto';
import { TaskDto } from '../task/dto/task.dto';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private schema: ObjectSchema) {}

  transform(value: UserDto | TaskDto) {
    if (!(value instanceof UserDto) || !(value instanceof TaskDto)) {
      return value;
    }
    const { error } = this.schema.validate(value);
    if (error) {
      throw new BadRequestException(error.message);
    }
    return value;
  }
}
