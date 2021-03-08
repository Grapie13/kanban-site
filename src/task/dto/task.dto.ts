import { TaskStage } from 'src/entities/Task.entity';

export class TaskDto {
  id?: number;
  name?: string;
  stage?: TaskStage;
  token?: string;
  username?: string;
}
