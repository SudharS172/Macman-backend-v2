import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ADMIN_SECRET: z.string().min(16, 'ADMIN_SECRET must be at least 16 characters'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  MAX_FILE_SIZE: z.string().default('500000000'),
  UPLOAD_DIR: z.string().default('./uploads'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
});

const parseEnv = () => {
  try {
    const env = envSchema.parse(process.env);
    return {
      nodeEnv: env.NODE_ENV,
      port: parseInt(env.PORT, 10),
      databaseUrl: env.DATABASE_URL,
      jwtSecret: env.JWT_SECRET,
      adminSecret: env.ADMIN_SECRET,
      allowedOrigins: env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
      maxFileSize: parseInt(env.MAX_FILE_SIZE, 10),
      uploadDir: env.UPLOAD_DIR,
      rateLimitWindowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
      rateLimitMaxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
    };
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment configuration');
  }
};

export const config = parseEnv();

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';

