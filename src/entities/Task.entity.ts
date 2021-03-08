import { User } from './User.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum TaskStage {
  TODO = 'TODO',
  DOING = 'DOING',
  DONE = 'DONE',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'enum',
    enum: TaskStage,
    default: TaskStage.TODO,
  })
  stage: TaskStage;

  @Column({
    name: 'createdat',
    type: 'timestamp with time zone',
    default: new Date(),
  })
  createdAt: Date;

  @Column({
    name: 'updatedat',
    type: 'timestamp with time zone',
    default: new Date(),
  })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
  user: User;
}
