export default () => ({
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT ?? '3008', 10),
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  app: {
    name: process.env.APP_NAME || 'Wallet Service',
    slug: process.env.APP_SLUG,
    logo_url: process.env.LOGO_URL,
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER ?? 'postgres',
    pass: process.env.DB_PASS ?? '',
    name: process.env.DB_NAME ?? '',
    ssl: process.env.DB_SSL === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessDuration: process.env.TOKEN_ACCESS_DURATION,
    refreshDuration: process.env.TOKEN_REFRESH_DURATION,
  },
  paystack: {
    url: process.env.PAYSTACK_URL,
    key: process.env.PAYSTACK_KEY,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  isDev(): boolean {
    const env = process.env.NODE_ENV;
    const envs = ['development', 'localhost', 'local', 'dev'];
    return !env || envs.includes(env);
  },
  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  },
});
