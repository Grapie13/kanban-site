import got from 'got';
import { Connection, createConnection, QueryRunner } from 'typeorm';
import { checkError, headers, loadEnv, signup, url } from './helpers';

// User values
const username = 'Tester';
const password = 'password';

describe('DELETE /v1/auth/user', () => {
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

  it('should return a 403 error if the user provides an invalid token', async () => {
    await got(`${url}/v1/auth/user`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ token: 'wrongtoken' }),
    }).catch((err) => {
      checkError(err, 403, 'You are not authorized to access this route');
    });
  });

  it('should delete the user', async () => {
    const token = await signup(username, password);

    const res = await got(`${url}/v1/auth/user`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ token }),
    });
    expect(res.statusCode).toEqual(200);
  });

  it('should return a 404 error if the user does not exist', async () => {
    const token = await signup(username, password);

    const res = await got(`${url}/v1/auth/user`, {
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
      checkError(err, 404, 'There is no user bound to this token');
    });
  });
});
