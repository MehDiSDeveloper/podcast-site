/**
 * Emits a JSON-LD block.
 *
 * The payload is built on the server from our own data, never from user input,
 * and `<` is escaped so a stray sequence in show notes cannot break out of the
 * script tag.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
