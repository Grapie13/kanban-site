import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 30,
    unique: true,
    nullable: false,
  })
  username: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  password: string;

  @Column({
    name: 'createdat',
    type: 'timestamp with time zone',
    default: new Date().toISOString(),
  })
  createdAt: Date;
}
