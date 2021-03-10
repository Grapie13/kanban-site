import got, { HTTPError } from 'got';
import * as dotenv from 'dotenv';
import * as path from 'path';

export const loadEnv = () => {
  return dotenv.config({
    path: path.join(__dirname, '../env/.test.env'),
  });
};
loadEnv();

export const headers = {
  'Content-Type': 'application/json',
};

export const url = `http://${process.env.TEST_HOST}:${process.env.APP_PORT}`;

export const signup = async (username: string, password: string) => {
  const res = await got(`${url}/v1/auth/signup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ username, password }),
  });
  expect(res.statusCode).toEqual(201);
  const { token } = JSON.parse(res.body);
  return token;
};

export const createTask = async (
  name: string,
  stage: string,
  token: string,
) => {
  const res = await got(`${url}/v1/task`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, stage, token }),
  });
  expect(res.statusCode).toEqual(201);
  const { task } = JSON.parse(res.body);
  return task;
};

export const checkError = (err: HTTPError, statusCode: number, msg: string) => {
  expect(err).toBeInstanceOf(HTTPError);
  expect(err.response.statusCode).toEqual(statusCode);
  const body = JSON.parse(err.response.body as string);
  expect(body.message).toEqual(msg);
};
