import { CACHE_MANAGER, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User.entity';
import { UserDto } from './dto/user.dto';
import { Cache } from 'cache-manager';
import { HelperService } from '../helper/helper.service';
import { TaskService } from '../task/task.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly helperService: HelperService,
    @Inject(forwardRef(() => TaskService))
    private readonly taskService: TaskService,
  ) {}

  async findByUsername(username: string): Promise<User> {
    let user = await this.getCachedUser(username);
    if (!user) {
      user = await this.usersRepository.findOne(
        {
          username,
        },
        { relations: ['tasks'] },
      );
      if (user) {
        await this.cacheUser(user);
      }
    }
    return user;
  }

  async createUser(userDto: UserDto): Promise<User> {
    const { username, password } = userDto;
    let user = new User();
    user.username = username;
    user.password = await this.helperService.hashPassword(password);
    user = await this.usersRepository.save(user);
    await this.cacheUser(user);
    return user;
  }

  async deleteUser(username: string): Promise<void> {
    const user = await this.findByUsername(username);
    await this.deleteUserCache(username);
    await this.taskService.deleteUsersTaskCache(user);
    await this.usersRepository.delete({ username });
  }

  private async cacheUser(user: User): Promise<void> {
    await this.cacheManager.set(`user:${user.username}`, user);
  }

  private async getCachedUser(username: string): Promise<User> {
    return this.cacheManager.get(`user:${username}`);
  }

  async deleteUserCache(username: string): Promise<void> {
    await this.cacheManager.del(`user:${username}`);
  }
}
