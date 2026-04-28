import { describe, expect, it } from 'vitest';
import { htmlEscape } from '@/modules/notifications/templates/escape';

describe('htmlEscape', () => {
  it('escapes the standard five characters', () => {
    expect(htmlEscape('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('escapes & FIRST so other escapes are not double-escaped', () => {
    // If `&` were escaped after `<`, the `&` from `&lt;` would itself become
    // `&amp;lt;` — broken output. Verify the canonical "ampersand first"
    // ordering still holds.
    expect(htmlEscape('<script>')).toBe('&lt;script&gt;');
    expect(htmlEscape('a & b')).toBe('a &amp; b');
    expect(htmlEscape('"hello"')).toBe('&quot;hello&quot;');
  });

  it('is safe to call on attribute values that include quotes', () => {
    // The CodeQL finding that triggered htmlEscape's creation: attribute
    // interpolation must escape `"` so users cannot break out.
    const url = 'https://example.com/path?q="injected" onerror=alert(1)';
    const escaped = htmlEscape(url);
    expect(escaped).not.toContain('"');
    expect(escaped).toContain('&quot;');
  });

  it('passes through clean strings unchanged', () => {
    expect(htmlEscape('hello world 42')).toBe('hello world 42');
  });

  it('handles empty input', () => {
    expect(htmlEscape('')).toBe('');
  });
});
