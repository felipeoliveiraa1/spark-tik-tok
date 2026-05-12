import pino from "pino";
import { env, isDev } from "./config.js";

export const log = pino({
  level: isDev ? "debug" : "info",
  base: { service: "spark-scraper", env: env.NODE_ENV },
  transport: isDev
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } }
    : undefined,
});
