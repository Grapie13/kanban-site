import got from 'got';
import { Connection, createConnection, QueryRunner } from 'typeorm';
import { checkError, headers, loadEnv, signup, url } from './helpers';

// User values
const username = 'Tester';
const password = 'password';

describe('POST /v1/auth/signin', () => {
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

  it('should return a 401 error if the user does not exist in database', async () => {
    await got(`${url}/v1/auth/signin`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password }),
    }).catch((err) => {
      checkError(err, 401, 'Invalid username or password');
    });
  });

  it('should return a 401 error if the password is incorrect', async () => {
    await signup(username, password);

    await got(`${url}/v1/auth/signin`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password: 'wrongpassword' }),
    }).catch((err) => {
      checkError(err, 401, 'Invalid username or password');
    });
  });

  it('should return the user details (without the password) along with a token', async () => {
    await signup(username, password);

    const res = await got(`${url}/v1/auth/signin`, {
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
