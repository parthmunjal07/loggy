// prisma.config.ts — Prisma 7 configuration (replaces datasource url in schema.prisma)
// The CLI reads this file for migrations; PrismaClient uses the adapter at runtime.

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
