import "server-only";

import { setInquirySeen, setInquiryStarred, setInquiryStatus } from "./inquiries";
import { inquiryKeyboard } from "./inquiry-notifications";
import { answerCallback, isFromOwnerChat, replaceKeyboard, startBotPolling, type CallbackQuery } from "./messenger";

/**
 * Lets the owner triage an inquiry from the messenger notice itself — mark it
 * read, star, reject or archive it — using the same fields as the admin panel.
 * Undoing a reject or archive puts the inquiry back to «خوانده‌شده».
 */

const actions = {
  seen: { run: (id: string) => setInquirySeen(id, true), done: "علامت «خوانده‌شده» خورد." },
  unseen: { run: (id: string) => setInquirySeen(id, false), done: "دوباره «جدید» شد." },
  star: { run: (id: string) => setInquiryStarred(id, true), done: "به محبوب‌ها اضافه شد." },
  unstar: { run: (id: string) => setInquiryStarred(id, false), done: "از محبوب‌ها برداشته شد." },
  reject: { run: (id: string) => setInquiryStatus(id, "REJECTED"), done: "درخواست رد شد." },
  unreject: { run: (id: string) => setInquiryStatus(id, "READ"), done: "رد لغو شد." },
  archive: { run: (id: string) => setInquiryStatus(id, "ARCHIVED"), done: "بایگانی شد." },
  unarchive: { run: (id: string) => setInquiryStatus(id, "READ"), done: "از بایگانی خارج شد." },
};

export function startInquiryBot(): void {
  startBotPolling(handleCallback);
}

async function handleCallback(query: CallbackQuery): Promise<void> {
  const match = /^inquiry:(\w+):(\w+)$/.exec(query.data ?? "");
  const action = match && Object.hasOwn(actions, match[1]) ? actions[match[1] as keyof typeof actions] : null;
  if (!match || !action || !isFromOwnerChat(query)) {
    await answerCallback(query, "این دکمه معتبر نیست.");
    return;
  }

  const inquiry = await action.run(match[2]);
  if (!inquiry) {
    await answerCallback(query, "این درخواست دیگر وجود ندارد.");
    return;
  }

  await replaceKeyboard(query, inquiryKeyboard(inquiry)).catch(() => {
    // "message is not modified" when pressed twice — harmless.
  });
  await answerCallback(query, action.done);
}
