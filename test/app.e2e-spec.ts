import got, { HTTPError } from 'got';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Connection, createConnection, QueryRunner } from 'typeorm';

const username = 'Tester';
const password = 'password';
const headers = {
  'Content-Type': 'application/json',
};

describe('Kanban-site e2e', () => {
  let connection: Connection;
  let queryRunner: QueryRunner;
  let url: string;

  beforeAll(async () => {
    dotenv.config({
      path: path.join(__dirname, '../env/.test.env'),
    });
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
    url = `http://${process.env.TEST_HOST}:${process.env.APP_PORT}`;
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

  describe('Auth', () => {
    describe('GET /v1/auth/user/:username', () => {
      it('should return a 404 error if the user does not exist', async () => {
        await got(`${url}/v1/auth/user/Doesnotexist`).catch((err) => {
          expect(err).toBeInstanceOf(HTTPError);
          expect(err.response.statusCode).toEqual(404);
          const body = JSON.parse(err.response.body);
          expect(body.message).toEqual('No user with that username exists');
        });
      });

      it('should find a user', async () => {
        let res = await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password }),
        });
        expect(res.statusCode).toEqual(201);

        res = await got(`${url}/v1/auth/user/${username}`);
        expect(res.statusCode).toEqual(200);
        const { user } = JSON.parse(res.body);
        expect(user).toBeDefined();
        expect(user.username).toEqual(username);
        expect(user.password).toBeUndefined();
      });
    });

    describe('POST /v1/auth/signup', () => {
      it('should return a 400 error if the username is empty, less or 3 characters, more than 20 characters, or is not a string', async () => {
        await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username: '', password }),
        }).catch((err) => {
          expect(err).toBeInstanceOf(HTTPError);
          expect(err.response.statusCode).toEqual(400);
          const body = JSON.parse(err.response.body);
          expect(body.message).toEqual('Username cannot be empty');
        });

        await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            username: 'superlongusernamethatwillnotpassthevalidation',
            password,
          }),
        }).catch((err) => {
          expect(err).toBeInstanceOf(HTTPError);
          expect(err.response.statusCode).toEqual(400);
          const body = JSON.parse(err.response.body);
          expect(body.message).toEqual('Username cannot exceed 20 characters');
        });

        await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username: 'no', password }),
        }).catch((err) => {
          expect(err).toBeInstanceOf(HTTPError);
          expect(err.response.statusCode).toEqual(400);
          const body = JSON.parse(err.response.body);
          expect(body.message).toEqual(
            'Username has to be at least 3 characters long',
          );
        });

        await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username: 321, password }),
        }).catch((err) => {
          expect(err).toBeInstanceOf(HTTPError);
          expect(err.response.statusCode).toEqual(400);
          const body = JSON.parse(err.response.body);
          expect(body.message).toEqual(
            'Username must contain at least one character',
          );
        });
      });

      it('should return a 400 error if the password is empty, less or 6 characters, more than 30 characters, or is not a string', async () => {
        await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password: '' }),
        }).catch((err) => {
          expect(err).toBeInstanceOf(HTTPError);
          expect(err.response.statusCode).toEqual(400);
          const body = JSON.parse(err.response.body);
          expect(body.message).toEqual('Password cannot be empty');
        });

        await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            username,
            password: 'superlongpasswordthatwilldefinitelynotpassthecheck',
          }),
        }).catch((err) => {
          expect(err).toBeInstanceOf(HTTPError);
          expect(err.response.statusCode).toEqual(400);
          const body = JSON.parse(err.response.body);
          expect(body.message).toEqual('Password cannot exceed 30 characters');
        });

        await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password: 'short' }),
        }).catch((err) => {
          expect(err).toBeInstanceOf(HTTPError);
          expect(err.response.statusCode).toEqual(400);
          const body = JSON.parse(err.response.body);
          expect(body.message).toEqual(
            'Password has to be at least 6 characters long',
          );
        });

        await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password: 123 }),
        }).catch((err) => {
          expect(err).toBeInstanceOf(HTTPError);
          expect(err.response.statusCode).toEqual(400);
          const body = JSON.parse(err.response.body);
          expect(body.message).toEqual(
            'Password must contain at least one character',
          );
        });
      });

      it('should return a 400 error if a user with that username already exists', async () => {
        const res = await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password }),
        });
        expect(res.statusCode).toEqual(201);

        await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password }),
        }).catch((err) => {
          expect(err).toBeInstanceOf(HTTPError);
          expect(err.response.statusCode).toEqual(400);
          const body = JSON.parse(err.response.body);
          expect(body.message).toEqual(
            'A user with this username already exists',
          );
        });
      });

      it('should create a user and return its details (without the password) along with a token', async () => {
        const res = await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password }),
        });
        expect(res.statusCode).toEqual(201);
        const body = JSON.parse(res.body);
        expect(body.token).toBeDefined();
        expect(body.user).toBeDefined();
        expect(body.user.username).toEqual(username);
        expect(body.user.password).toBeUndefined();
      });
    });

    describe('POST /v1/auth/signin', () => {
      it('should return a 401 error if the user does not exist in database', async () => {
        await got(`${url}/v1/auth/signin`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password }),
        }).catch((err) => {
          expect(err).toBeInstanceOf(HTTPError);
          expect(err.response.statusCode).toEqual(401);
          const body = JSON.parse(err.response.body);
          expect(body.message).toEqual('Invalid username or password');
        });
      });

      it('should return a 401 error if the password is incorrect', async () => {
        const res = await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password }),
        });
        expect(res.statusCode).toEqual(201);

        await got(`${url}/v1/auth/signin`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password: 'wrongpassword' }),
        }).catch((err) => {
          expect(err).toBeInstanceOf(HTTPError);
          expect(err.response.statusCode).toEqual(401);
          const body = JSON.parse(err.response.body);
          expect(body.message).toEqual('Invalid username or password');
        });
      });

      it('should return the user details (without the password) along with a token', async () => {
        let res = await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password }),
        });
        expect(res.statusCode).toEqual(201);

        res = await got(`${url}/v1/auth/signin`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password }),
        });
        expect(res.statusCode).toEqual(200);
        const body = JSON.parse(res.body);
        expect(body.token).toBeDefined();
        expect(body.user.username).toEqual(username);
        expect(body.user.password).toBeUndefined();
      });
    });

    describe('DELETE /v1/auth/user', () => {
      it('should return a 403 error if the user provides an invalid token', async () => {
        await got(`${url}/v1/auth/user`, {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ token: 'wrongtoken' }),
        }).catch((err) => {
          expect(err).toBeInstanceOf(HTTPError);
          expect(err.response.statusCode).toEqual(403);
          const body = JSON.parse(err.response.body);
          expect(body.message).toEqual(
            'You are not authorized to access this route',
          );
        });
      });

      it('should delete the user', async () => {
        let res = await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password }),
        });
        expect(res.statusCode).toEqual(201);
        const { token } = JSON.parse(res.body);

        res = await got(`${url}/v1/auth/user`, {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ token }),
        });
        expect(res.statusCode).toEqual(200);
      });

      it('should return a 404 error if the user does not exist', async () => {
        let res = await got(`${url}/v1/auth/signup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, password }),
        });
        expect(res.statusCode).toEqual(201);
        const { token } = JSON.parse(res.body);

        res = await got(`${url}/v1/auth/user`, {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ token }),
        });
        expect(res.statusCode).toEqual(200);

        await got(`${url}/v1/auth/user`, {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ token }),
        }).catch((err) => {
          expect(err).toBeInstanceOf(HTTPError);
          expect(err.response.statusCode).toEqual(404);
          const body = JSON.parse(err.response.body);
          expect(body.message).toEqual('There is no user bound to this token');
        });
      });
    });
  });
});
