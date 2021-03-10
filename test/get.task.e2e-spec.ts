import got from 'got';
import { Connection, createConnection, QueryRunner } from 'typeorm';
import { checkError, headers, loadEnv, signup, url } from './helpers';

// User values
const username = 'Tester';
const password = 'password';

// Task values
const name = 'Test task';
const stage = 'DOING';

describe('GET /v1/task/:id', () => {
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

  it('should return a 404 error if a task does not exist', async () => {
    await got(`${url}/v1/task/5000`).catch((err) => {
      checkError(err, 404, 'No task with that ID exists');
    });
  });

  it('should find a task', async () => {
    const token = await signup(username, password);

    let res = await got(`${url}/v1/task`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, stage, token }),
    });
    expect(res.statusCode).toEqual(201);
    const { task } = JSON.parse(res.body);

    res = await got(`${url}/v1/task/${task.id}`);
    expect(res.statusCode).toEqual(200);
    const body = JSON.parse(res.body);
    expect(body.task).toBeDefined();
    expect(body.task.name).toEqual(name);
    expect(body.task.stage).toEqual(stage);
  });
});
