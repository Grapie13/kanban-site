import got from 'got';
import { Connection, createConnection, QueryRunner } from 'typeorm';
import { checkError, loadEnv, signup, url } from './helpers';

// User values
const username = 'Tester';
const password = 'password';

describe('GET /v1/auth/user', () => {
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

  it('should return a 404 error if the user does not exist', async () => {
    await got(`${url}/v1/auth/user/Doesnotexist`).catch((err) => {
      checkError(err, 404, 'No user with that username exists');
    });
  });

  it('should find a user', async () => {
    await signup(username, password);

    const res = await got(`${url}/v1/auth/user/${username}`);
    expect(res.statusCode).toEqual(200);
    const { user } = JSON.parse(res.body);
    expect(user).toBeDefined();
    expect(user.username).toEqual(username);
    expect(user.password).toBeUndefined();
  });
});
