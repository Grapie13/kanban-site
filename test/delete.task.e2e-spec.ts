import got from 'got';
import { Connection, createConnection, QueryRunner } from 'typeorm';
import {
  checkError,
  createTask,
  headers,
  loadEnv,
  signup,
  url,
} from './helpers';

// User values
const username = 'Tester';
const password = 'password';

// Task values
const name = 'Test task';
const stage = 'DOING';

describe('DELETE /v1/task/:id', () => {
  let connection: Connection;
  let queryRunner: QueryRunner;

  beforeAll(async () => {
    loadEnv();
    connection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: parseInt(process.env.TYPEORM_PORT),
      username: process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD,
      database: process.env.TYPEORM_DATABASE,
      synchronize: true,
    });
    queryRunner = connection.createQueryRunner();
  });

  beforeEach(async () => {
    await queryRunner.query('DELETE FROM tasks');
    await queryRunner.query('DELETE FROM users');
  });

  afterAll(async () => {
    await queryRunner.query('DELETE FROM tasks');
    await queryRunner.query('DELETE FROM users');
    await queryRunner.release();
    await connection.close();
  });

  it('should return a 404 error if the task does not exist', async () => {
    const token = await signup(username, password);

    await got(`${url}/v1/task/5000`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ token }),
    }).catch((err) => {
      checkError(err, 404, 'No task with that ID exists');
    });
  });

  it('should return a 403 error if the user provides an invalid token', async () => {
    const token = await signup(username, password);
    const task = await createTask(name, stage, token);

    await got(`${url}/v1/task/${task.id}`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ token: 'wrongtoken' }),
    }).catch((err) => {
      checkError(err, 403, 'You are not authorized to access this route');
    });

    await got(`${url}/v1/task/${task.id}`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({}),
    }).catch((err) => {
      checkError(err, 403, 'You are not authorized to access this route');
    });
  });

  it('should return a 403 error if the user is not the owner', async () => {
    let token = await signup(username, password);
    const task = await createTask(name, stage, token);
    token = await signup('MaliciousUser', password);

    await got(`${url}/v1/task/${task.id}`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ token }),
    }).catch((err) => {
      checkError(err, 403, 'You are not authorized to delete this task');
    });
  });

  it('should delete a task', async () => {
    const token = await signup(username, password);
    const task = await createTask(name, stage, token);

    const res = await got(`${url}/v1/task/${task.id}`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ token }),
    });
    expect(res.statusCode).toEqual(200);
  });
});
