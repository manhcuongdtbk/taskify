/** Build-time NODE_ENV flags — sole module allowed to read `process.env.NODE_ENV` (ESLint). */

export const isDevelopment = process.env.NODE_ENV === "development";

export const isProduction = process.env.NODE_ENV === "production";
