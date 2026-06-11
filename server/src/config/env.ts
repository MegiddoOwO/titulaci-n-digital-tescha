import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const env = {
  // Database
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT || "3306", 10),
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "sca_tescha",
  DB_CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT || "10", 10),

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",

  // Server
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:8080",

  // Rate limiting
  LOGIN_MAX_ATTEMPTS: parseInt(process.env.LOGIN_MAX_ATTEMPTS || "5", 10),
  LOGIN_BLOCK_MINUTES: parseInt(process.env.LOGIN_BLOCK_MINUTES || "15", 10),
};
