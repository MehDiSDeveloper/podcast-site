import bcrypt from "bcryptjs";

/**
 * Cost 12 is the current sensible default: roughly 250ms on commodity
 * hardware, which is slow enough to matter offline and fast enough for a login.
 */
const COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Runs a comparison against a throwaway hash so a request for a username that
 * does not exist takes about as long as one that does. Without it, response
 * timing leaks which usernames are real.
 */
const DUMMY_HASH = "$2b$12$Kd3XnUlSwlLj6eB7jhAGfebVCGs50kAaIWpC8b9XnEj7I2vVqQlfe";

export async function fakeVerify(): Promise<void> {
  await bcrypt.compare("no-such-password", DUMMY_HASH);
}
