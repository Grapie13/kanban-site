const VARS = [
  'TYPEORM_HOST',
  'TYPEORM_USERNAME',
  'TYPEORM_PASSWORD',
  'TYPEORM_DATABASE',
  'TYPEORM_PORT',
  'TYPEORM_MIGRATIONS',
  'CACHE_HOST',
  'CACHE_PORT',
  'JWT_SECRET',
];
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
