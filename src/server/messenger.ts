import "server-only";

/**
 * Talks to a Telegram-compatible bot API.
 *
 * Bale (https://tapi.bale.ai, reachable inside Iran) and Telegram
 * (https://api.telegram.org) expose the same methods, so one implementation
 * covers both — NOTIFY_BOT_API picks the service.
 */

const DEFAULT_API = "https://tapi.bale.ai";

/** Both services reject messages longer than 4096 characters. */
const MAX_LENGTH = 4000;

type BotConfig = { api: string; token: string; chatId: string };

export type InlineButton = { text: string; callback_data: string };
export type InlineKeyboard = InlineButton[][];

export type CallbackQuery = {
  id: string;
  data?: string;
  message?: { message_id: number; chat: { id: number | string } };
};

function readConfig(): BotConfig | null {
  const token = process.env.NOTIFY_BOT_TOKEN?.trim();
  const chatId = process.env.NOTIFY_BOT_CHAT_ID?.trim();
  if (!token || !chatId) return null;

  const api = (process.env.NOTIFY_BOT_API?.trim() || DEFAULT_API).replace(/\/$/, "");
  return { api, token, chatId };
}

/** Calls a bot method and returns its `result`; throws on API errors. */
async function callBot<T>(config: BotConfig, method: string, payload: object, timeoutMs = 10_000): Promise<T> {
  const response = await fetch(`${config.api}/bot${config.token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const data = (await response.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
  if (!response.ok || !data?.ok) {
    // The token is part of the URL, so report only the status and API reply.
    throw new Error(`bot ${method} responded ${response.status}: ${String(data?.description ?? "").slice(0, 200)}`);
  }
  return data.result as T;
}

/** Splits on line breaks so no chunk exceeds the API limit. */
function splitMessage(text: string): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const line of text.split("\n")) {
    for (let start = 0; start < Math.max(line.length, 1); start += MAX_LENGTH) {
      const piece = line.slice(start, start + MAX_LENGTH);
      if (current && current.length + 1 + piece.length > MAX_LENGTH) {
        chunks.push(current);
        current = piece;
      } else {
        current = current ? `${current}\n${piece}` : piece;
      }
    }
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

/**
 * Sends `text` (split into several messages when too long). Buttons go on the
 * last message so they sit under the whole notice. Returns false when no bot
 * is configured; throws on API errors.
 */
export async function sendBotMessage(text: string, keyboard?: InlineKeyboard): Promise<boolean> {
  const config = readConfig();
  if (!config) return false;

  const chunks = splitMessage(text);
  for (const [index, chunk] of chunks.entries()) {
    const isLast = index === chunks.length - 1;
    // Plain text (no parse_mode) so visitor input can never break the formatting.
    await callBot(config, "sendMessage", {
      chat_id: config.chatId,
      text: chunk,
      ...(isLast && keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
    });
  }
  return true;
}

/** Only presses from the configured chat are trusted. */
export function isFromOwnerChat(query: CallbackQuery): boolean {
  const config = readConfig();
  return Boolean(config && query.message && String(query.message.chat.id) === config.chatId);
}

export async function answerCallback(query: CallbackQuery, text: string): Promise<void> {
  const config = readConfig();
  if (!config) return;
  await callBot(config, "answerCallbackQuery", { callback_query_id: query.id, text });
}

export async function replaceKeyboard(query: CallbackQuery, keyboard: InlineKeyboard): Promise<void> {
  const config = readConfig();
  if (!config || !query.message) return;
  await callBot(config, "editMessageReplyMarkup", {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: { inline_keyboard: keyboard },
  });
}

// ------------------------------------------------------------ button presses

const POLL_SECONDS = 30;
const RETRY_MS = 15_000;

/**
 * Receives button presses by long-polling getUpdates. Polling (rather than a
 * webhook) works behind NAT and without a public HTTPS address. Runs for the
 * life of the server process; safe to call more than once.
 */
export function startBotPolling(onCallback: (query: CallbackQuery) => Promise<void>): void {
  const config = readConfig();
  const state = globalThis as { __botPolling?: boolean };
  if (!config || state.__botPolling) return;
  state.__botPolling = true;

  void (async () => {
    let offset = 0;
    for (;;) {
      try {
        const updates = await callBot<{ update_id: number; callback_query?: CallbackQuery }[]>(
          config,
          "getUpdates",
          { offset, timeout: POLL_SECONDS, allowed_updates: ["callback_query"] },
          (POLL_SECONDS + 10) * 1000,
        );
        for (const update of updates) {
          offset = update.update_id + 1;
          if (!update.callback_query) continue;
          await onCallback(update.callback_query).catch((error: unknown) =>
            console.error("[messenger] button press failed:", error),
          );
        }
      } catch (error) {
        console.error("[messenger] getUpdates failed, retrying:", error);
        await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
      }
    }
  })();
}

/** Logs whether the bot token is valid, so a typo shows up at startup. */
export async function checkMessengerSetup(): Promise<void> {
  const config = readConfig();
  if (!config) {
    console.warn("[messenger] NOTIFY_BOT_TOKEN or NOTIFY_BOT_CHAT_ID is empty — messenger notifications are disabled.");
    return;
  }

  try {
    const me = await callBot<{ username?: string }>(config, "getMe", {});
    console.info(`[messenger] bot @${me.username ?? "?"} ready at ${config.api}.`);
  } catch (error) {
    console.error("[messenger] bot check failed — notifications will not be delivered:", error);
  }
}
