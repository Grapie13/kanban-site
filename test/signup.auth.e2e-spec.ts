import got from 'got';
import { Connection, createConnection, QueryRunner } from 'typeorm';
import { checkError, headers, loadEnv, signup, url } from './helpers';

// User values
const username = 'Tester';
const password = 'password';

describe('POST /v1/auth/signup', () => {
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

  it('should return a 400 error if the username is empty, less or 3 characters, more than 20 characters, or is not a string', async () => {
    await got(`${url}/v1/auth/signup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username: '', password }),
    }).catch((err) => {
      checkError(err, 400, 'Username cannot be empty');
    });

    await got(`${url}/v1/auth/signup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        username: 'superlongusernamethatwillnotpassthevalidation',
        password,
      }),
    }).catch((err) => {
      checkError(err, 400, 'Username cannot exceed 20 characters');
    });

    await got(`${url}/v1/auth/signup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username: 'no', password }),
    }).catch((err) => {
      checkError(err, 400, 'Username has to be at least 3 characters long');
    });

    await got(`${url}/v1/auth/signup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username: 321, password }),
    }).catch((err) => {
      checkError(err, 400, 'Username must contain at least one character');
    });
  });

  it('should return a 400 error if the password is empty, less or 6 characters, more than 30 characters, or is not a string', async () => {
    await got(`${url}/v1/auth/signup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password: '' }),
    }).catch((err) => {
      checkError(err, 400, 'Password cannot be empty');
    });

    await got(`${url}/v1/auth/signup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        username,
        password: 'superlongpasswordthatwilldefinitelynotpassthecheck',
      }),
    }).catch((err) => {
      checkError(err, 400, 'Password cannot exceed 30 characters');
    });

    await got(`${url}/v1/auth/signup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password: 'short' }),
    }).catch((err) => {
      checkError(err, 400, 'Password has to be at least 6 characters long');
    });

    await got(`${url}/v1/auth/signup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password: 123 }),
    }).catch((err) => {
      checkError(err, 400, 'Password must contain at least one character');
    });
  });

  it('should return a 400 error if a user with that username already exists', async () => {
    await signup(username, password);

    await got(`${url}/v1/auth/signup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password }),
    }).catch((err) => {
      checkError(err, 400, 'A user with this username already exists');
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
