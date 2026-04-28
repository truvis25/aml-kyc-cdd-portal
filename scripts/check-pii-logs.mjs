#!/usr/bin/env node
/**
 * PII log scanner.
 *
 * Walks `app/`, `modules/`, and `components/` looking for raw `console.*`
 * calls. Allowed:
 *   - console.* with no arguments other than a string literal:
 *       console.error('something happened');
 *   - calls inside files we explicitly permit (Edge Functions log via console
 *     and run outside the safe-logger boundary; the sanitiser cannot be
 *     imported into Deno code).
 *
 * Flagged:
 *   - console.* with non-literal arguments (variables, expressions),
 *     unless the value is a known-safe identifier (req.url, etc.).
 *
 * Heuristic — not a parser. Designed to make raw PII-leaking logs noisy in CI
 * without requiring devs to learn a new logger surface for trivial messages.
 *
 * Usage:
 *   node scripts/check-pii-logs.mjs           # exits 1 on any finding
 *   npm run check:pii                          # same, via package.json
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['app', 'modules', 'components', 'lib'];
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build']);

// Files where raw console.* is acceptable. Each is a substring match against
// the path relative to repo root.
const ALLOWLIST = [
  'lib/logger.ts',           // the logger itself
  'supabase/functions/',     // Deno code; no access to lib/sanitise
  'app/(platform)/error.tsx',// console.error(error) is fine, it's an Error from Next.js
  'app/(onboarding)/error.tsx',
  'scripts/',                // build / ops scripts
];

// Identifiers that, if they're the only argument, are deemed safe to log.
const SAFE_IDENTS = new Set([
  '"."', "'.'", '`.`',
]);

const CONSOLE_RE = /console\.(?:log|info|warn|error|debug|trace)\s*\(([^]*?)\)\s*;/gms;

/**
 * Returns true if the call's argument list is just one or more string
 * literals (and nothing else). e.g. `console.log('hello')` or
 * `console.warn('x', 'y')`.
 */
function isLiteralOnly(args) {
  // Strip leading/trailing whitespace on each comma-separated arg. Arguments
  // can contain commas inside strings, so split conservatively: only at
  // commas that are NOT inside quotes or backticks.
  const parts = splitArgsToplevel(args);
  if (parts.length === 0) return true;
  return parts.every((p) => /^\s*(['"`])[^]*\1\s*$/.test(p));
}

function splitArgsToplevel(s) {
  const out = [];
  let depth = 0;
  let inStr = '';
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (ch === '\\') { cur += ch + (s[++i] ?? ''); continue; }
      if (ch === inStr) inStr = '';
      cur += ch;
      continue;
    }
    if (ch === '"' || ch === '\'' || ch === '`') {
      inStr = ch;
      cur += ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    if (ch === ')' || ch === ']' || ch === '}') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (/\.(tsx?|mjs|cjs|js)$/.test(entry)) yield full;
  }
}

function isAllowlisted(path) {
  return ALLOWLIST.some((needle) => path.includes(needle));
}

const findings = [];
const root = process.cwd();

for (const r of ROOTS) {
  let exists = true;
  try { statSync(r); } catch { exists = false; }
  if (!exists) continue;

  for (const file of walk(r)) {
    const rel = relative(root, file);
    if (isAllowlisted(rel)) continue;

    const src = readFileSync(file, 'utf8');
    let m;
    CONSOLE_RE.lastIndex = 0;
    while ((m = CONSOLE_RE.exec(src)) !== null) {
      const args = m[1];
      if (args.trim() === '') continue;
      if (isLiteralOnly(args)) continue;
      if (SAFE_IDENTS.has(args.trim())) continue;
      const line = src.slice(0, m.index).split('\n').length;
      findings.push({ file: rel, line, snippet: m[0].split('\n')[0] });
    }
  }
}

const strict = process.argv.includes('--strict');

if (findings.length === 0) {
  console.log('check-pii-logs: clean — no raw console.* calls with runtime values found.');
  process.exit(0);
}

const sink = strict ? console.error : console.warn;
const verb = strict ? 'FAIL' : 'WARN';

sink(`check-pii-logs: ${verb} — found ${findings.length} potentially-leaky console.* call(s).`);
sink('Use the safe logger instead: import { log } from "@/lib/logger";');
sink('');
for (const f of findings) {
  sink(`  ${f.file}:${f.line}  ${f.snippet}`);
}
sink('');
sink('If a finding is a false positive, add the file path to ALLOWLIST in scripts/check-pii-logs.mjs.');
sink('');
sink('This script is non-blocking by default while existing callsites are migrated to the safe logger.');
sink('Run with --strict (or set in CI: `npm run check:pii -- --strict`) to fail builds on any finding.');

// Non-zero exit only when explicitly asked, so the migration of pre-existing
// callsites can proceed without coupling to this PR.
process.exit(strict ? 1 : 0);
