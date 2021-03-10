import got, { HTTPError } from 'got';
import { Connection, createConnection, QueryRunner } from 'typeorm';
import { randomBytes } from 'crypto';
import { headers, loadEnv, url } from './helpers';

// User values
const username = 'Tester';
const password = 'password';

// Task values
const name = 'Test task';
const stage = 'DOING';

describe('Kanban-site task e2e', () => {
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

  describe('GET /v1/task/:id', () => {
    it('should return a 404 error if a task does not exist', async () => {
      await got(`${url}/v1/task/5000`).catch((err) => {
        expect(err).toBeInstanceOf(HTTPError);
        expect(err.response.statusCode).toEqual(404);
        const body = JSON.parse(err.response.body);
        expect(body.message).toEqual('No task with that ID exists');
      });
    });

    it('should find a task', async () => {
      let res = await got(`${url}/v1/auth/signup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username, password }),
      });
      expect(res.statusCode).toEqual(201);
      const { token } = JSON.parse(res.body);

      res = await got(`${url}/v1/task`, {
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

  describe('POST /v1/task', () => {
    it('should return a 403 error if the user does not provide a token or the token is invalid', async () => {
      await got(`${url}/v1/task`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, stage }),
      }).catch((err) => {
        expect(err).toBeInstanceOf(HTTPError);
        expect(err.response.statusCode).toEqual(403);
        const body = JSON.parse(err.response.body);
        expect(body.message).toEqual(
          'You are not authorized to access this route',
        );
      });

      await got(`${url}/v1/task`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, stage, token: 'wrongtoken' }),
      }).catch((err) => {
        expect(err).toBeInstanceOf(HTTPError);
        expect(err.response.statusCode).toEqual(403);
        const body = JSON.parse(err.response.body);
        expect(body.message).toEqual(
          'You are not authorized to access this route',
        );
      });
    });

    it('should return a 400 error if the name does not pass validation', async () => {
      const res = await got(`${url}/v1/auth/signup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username, password }),
      });
      expect(res.statusCode).toEqual(201);
      const { token } = JSON.parse(res.body);

      await got(`${url}/v1/task`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '', stage, token }),
      }).catch((err) => {
        expect(err).toBeInstanceOf(HTTPError);
        expect(err.response.statusCode).toEqual(400);
        const body = JSON.parse(err.response.body);
        expect(body.message).toEqual('Name cannot be empty');
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
        expect(err).toBeInstanceOf(HTTPError);
        expect(err.response.statusCode).toEqual(400);
        const body = JSON.parse(err.response.body);
        expect(body.message).toEqual('Name cannot exceed 255 characters');
      });

      await got(`${url}/v1/task`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          stage,
          token,
        }),
      }).catch((err) => {
        expect(err).toBeInstanceOf(HTTPError);
        expect(err.response.statusCode).toEqual(400);
        const body = JSON.parse(err.response.body);
        expect(body.message).toEqual('Name is required');
      });
    });
  });
});
