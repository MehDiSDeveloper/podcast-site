/**
 * Next.js calls this once when the server process starts, which is the right
 * place to guarantee the admin account and default show exist.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { bootstrap } = await import("@/server/bootstrap");
  await bootstrap();

  // Not awaited: a slow or unreachable service must not delay startup.
  const { checkMailSetup } = await import("@/server/mail");
  const { checkMessengerSetup } = await import("@/server/messenger");
  void checkMailSetup();
  void checkMessengerSetup();

  // Listens for the triage buttons under inquiry notices. Never during a
  // build: an endless poll would keep the build worker alive.
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    const { startInquiryBot } = await import("@/server/inquiry-bot");
    startInquiryBot();
  }
}
