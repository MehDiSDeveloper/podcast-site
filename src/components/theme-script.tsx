/**
 * Applies the stored (or system) theme before first paint.
 *
 * This has to be an inline, render-blocking script: doing it in an effect
 * would let a light frame flash on a dark-mode device.
 */
const script = `(function(){try{var s=localStorage.getItem("theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} suppressHydrationWarning />;
}
