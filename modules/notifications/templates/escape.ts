/**
 * HTML-escape a string so it is safe to interpolate into both element
 * content and attribute values (i.e. inside both `<p>{x}</p>` and
 * `<a href="{x}">`). Escapes the standard five characters; do NOT use
 * for JavaScript-context interpolation.
 */
export function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
