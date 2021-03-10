import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User.entity';
import { UserDto } from './dto/user.dto';
import { HelperService } from '../helper/helper.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly helperService: HelperService,
  ) {}

  async findByUsername(username: string): Promise<User> {
    return this.usersRepository.findOne(
      {
        username,
      },
      { relations: ['tasks'] },
    );
  }

  async createUser(userDto: UserDto): Promise<User> {
    const { username, password } = userDto;
    let user = new User();
    user.username = username;
    user.password = await this.helperService.hashPassword(password);
    user = await this.usersRepository.save(user);
    return user;
  }

  async deleteUser(username: string): Promise<void> {
    await this.usersRepository.delete({ username });
  }
}
