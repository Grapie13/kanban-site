import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/User.entity';
import { AuthDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findByUsername(username: string): Promise<User> {
    return this.usersRepository.findOne({ username });
  }

  async createUser(userInfo: AuthDto): Promise<User> {
    const { username, password } = userInfo;
    const user = new User();
    user.username = username;
    user.password = await bcrypt.hash(password, 15);
    return this.usersRepository.save(user);
  }
}
