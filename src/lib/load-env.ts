/**
 * Loads .env for processes Next.js does not start itself (the Prisma CLI and
 * the seed script). Inside the app this is a no-op, because Next has already
 * populated process.env by the time any module runs.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

for (const file of [".env.local", ".env"]) {
  try {
    const contents = readFileSync(resolve(process.cwd(), file), "utf8");

    for (const rawLine of contents.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const eq = line.indexOf("=");
      if (eq === -1) continue;

      const key = line.slice(0, eq).trim();
      if (key in process.env) continue;

      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // Missing file is fine — the environment may be configured externally.
  }
}
