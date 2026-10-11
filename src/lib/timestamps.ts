/**
 * Turns times written in show notes («۱۲:۳۰», «1:02:05») into buttons that
 * jump the player to that moment. Runs on already-sanitised HTML and only
 * touches text between tags, never attributes or link text.
 */

const D = "[0-9۰-۹]";
const TIMESTAMP = new RegExp(`(?<![0-9۰-۹:])(?:(${D}{1,2}):)?(${D}{1,2}):(${D}{2})(?![0-9۰-۹:])`, "g");

const toNumber = (digits: string) =>
  Number(digits.replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0)));

export function linkTimestamps(html: string): string {
  let inLink = false;

  return html
    .split(/(<[^>]*>)/)
    .map((part) => {
      if (part.startsWith("<")) {
        if (/^<a[\s>]/i.test(part)) inLink = true;
        else if (/^<\/a\s*>/i.test(part)) inLink = false;
        return part;
      }
      if (inLink) return part;

      return part.replace(TIMESTAMP, (match, hours: string | undefined, minutes: string, seconds: string) => {
        const h = hours ? toNumber(hours) : 0;
        const m = toNumber(minutes);
        const s = toNumber(seconds);
        if (s > 59 || (hours && m > 59)) return match;
        return `<button type="button" class="timestamp" dir="ltr" data-seek="${h * 3600 + m * 60 + s}">${match}</button>`;
      });
    })
    .join("");
}
