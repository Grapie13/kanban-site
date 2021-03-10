import got from 'got';
import { Connection, createConnection, QueryRunner } from 'typeorm';
import { randomBytes } from 'crypto';
import { checkError, headers, loadEnv, signup, url } from './helpers';

// User values
const username = 'Tester';
const password = 'password';

// Task values
const name = 'Test task';
const stage = 'DOING';

describe('POST /v1/task', () => {
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

  it('should return a 403 error if the user does not provide a token or the token is invalid', async () => {
    await got(`${url}/v1/task`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, stage }),
    }).catch((err) => {
      checkError(err, 403, 'You are not authorized to access this route');
    });

    await got(`${url}/v1/task`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, stage, token: 'wrongtoken' }),
    }).catch((err) => {
      checkError(err, 403, 'You are not authorized to access this route');
    });
  });

  it('should return a 400 error if the name does not pass validation', async () => {
    const token = await signup(username, password);

    await got(`${url}/v1/task`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '', stage, token }),
    }).catch((err) => {
      checkError(err, 400, 'Name cannot be empty');
    });

    await got(`${url}/v1/task`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: randomBytes(256).toString('hex'),
        stage,
        token,
      }),
    }).catch((err) => {
      checkError(err, 400, 'Name cannot exceed 255 characters');
    });

    await got(`${url}/v1/task`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        stage,
        token,
      }),
    }).catch((err) => {
      checkError(err, 400, 'Name is required');
    });
  });

  it('should return a 400 error if the stage does not pass validation', async () => {
    const token = await signup(username, password);

    await got(`${url}/v1/task`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, stage: 'NOT_A_STAGE', token }),
    }).catch((err) => {
      checkError(
        err,
        400,
        'Stage has to be one of the following: TODO, DOING, DONE',
      );
    });

    await got(`${url}/v1/task`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, stage: '', token }),
    }).catch((err) => {
      checkError(
        err,
        400,
        'Stage has to be one of the following: TODO, DOING, DONE',
      );
    });
  });

  it('should create a task and return its details', async () => {
    const token = await signup(username, password);

    const res = await got(`${url}/v1/task`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, stage, token }),
    });
    expect(res.statusCode).toEqual(201);
    const body = JSON.parse(res.body);
    expect(body.task).toBeDefined();
    expect(body.task.name).toEqual(name);
    expect(body.task.stage).toEqual(stage);
    expect(body.task.user.username).toEqual(username);
  });
});
