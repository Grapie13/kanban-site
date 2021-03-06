export const envVariablesCheck = () => {
  const checkFailed =
    !process.env.TYPEORM_HOST ||
    !process.env.TYPEORM_USERNAME ||
    !process.env.TYPEORM_PASSWORD ||
    !process.env.TYPEORM_DATABASE ||
    !process.env.TYPEORM_PORT ||
    !process.env.TYPEORM_MIGRATIONS ||
    !process.env.JWT_SECRET;

  if (checkFailed) {
    console.error('One or more required environment variables are missing');
    process.exit(1);
  }
};
