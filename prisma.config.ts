import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer reads the datasource URL from schema.prisma, and the CLI
// does not load .env on its own the way `next dev` does.
import "./src/lib/load-env";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
