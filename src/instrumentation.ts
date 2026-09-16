/**
 * Next.js calls this once when the server process starts, which is the right
 * place to guarantee the admin account and default show exist.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { bootstrap } = await import("@/server/bootstrap");
  await bootstrap();
}
