const VARS = [
  'TYPEORM_HOST',
  'TYPEORM_USERNAME',
  'TYPEORM_PASSWORD',
  'TYPEORM_DATABASE',
  'TYPEORM_PORT',
  'TYPEORM_MIGRATIONS',
  'APP_PORT',
  'JWT_SECRET',
];
if (process.env.NODE_ENV === 'test') {
  VARS.push('TEST_HOST');
}
let failMsg = '';

export const envVariablesCheck = () => {
  let passed = true;
  for (const variable of VARS) {
    if (!process.env[variable]) {
      failMsg += `${variable} needs to be set\n`;
      passed = false;
    }
  }
  failCheck(passed);
};

const failCheck = (passed: boolean) => {
  if (!passed) {
    console.error(failMsg);
    process.exit(1);
  }
};
