import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/User.entity';
import { UserDto } from './dto/user.dto';
import { Cache } from 'cache-manager';
import { HelperService } from '../helper/helper.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly helperService: HelperService,
  ) {}

  async findByUsername(username: string): Promise<User> {
    let user = await this.getCachedUser(username);
    if (!user) {
      user = await this.usersRepository.findOne({ username });
      if (user) {
        await this.cacheUser(user);
      }
    }
    return user;
  }

  async deleteUser(username: string): Promise<void> {
    await this.deleteUserCache(username);
    await this.usersRepository.delete({ username });
  }

  async createUser(userDto: UserDto): Promise<User> {
    const { username, password } = userDto;
    const user = new User();
    user.username = username;
    user.password = await this.helperService.hashPassword(password);
    return this.usersRepository.save(user);
  }

  private async cacheUser(user: User): Promise<void> {
    await this.cacheManager.set(`user:${user.username}`, user);
  }

  private async getCachedUser(username: string): Promise<User> {
    return this.cacheManager.get(`user:${username}`);
  }

  private async deleteUserCache(username: string): Promise<void> {
    await this.cacheManager.del(`user:${username}`);
  }
}
