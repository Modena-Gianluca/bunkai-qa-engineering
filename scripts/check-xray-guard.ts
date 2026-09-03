#!/usr/bin/env bun
/**
 * check-xray-guard.ts — quality gate for Xray naming + Set-first traceability
 *
 * Enforces the boilerplate's quality-over-speed contract without adding 20-30 min overhead.
 * Light check: ~2-3 min if run manually, ~2s in pre-commit.
 *
 * Checks:
 *  1. Every acceptance-test-plan.md that contains Test outlines must use TC01: should ... nomenclature (not T1)
 *  2. Every Story with Tests must have an ATS (Test Set) reference or be linked via ATS→Story (checked via local .md + Jira link hint)
 *  3. No direct TC→Story link when ATS exists (warn)
 *
 * Usage:
 *  bun run xray:guard                — check all
 *  bun run xray:guard --changed-only — check only staged acceptance-test-plan.md
 *  bun run xray:guard --project BK   — filter by project key in summary
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dir, '..');
const PBI_ROOT = join(REPO_ROOT, '.context', 'PBI');

const TC_PATTERN = /BK-\d+:\s*TC\d{2}:\s*should\s+/;
const BAD_T_PATTERN = /\bT\d+\b[^\n\r\u2014\u2028\u2029]*\u2014.*Orden|^\d+\.\s+\*\*[^*]+T\d+\b/m; // catches old T1 without TC
const ATS_PATTERN = /ATS:\s*BK-\d+:/;
const ATP_PATTERN = /ATP:\s*BK-\d+:/;

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) { return out; }
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    const s = statSync(full);
    if (s.isDirectory()) { walk(full, out); }
    else if (e === 'acceptance-test-plan.md') { out.push(full); }
  }
  return out;
}

function getStagedPlans(): string[] | null {
  if (!process.argv.includes('--changed-only')) { return null; }
  try {
    const staged = execSync('git diff --cached --name-only --diff-filter=ACMRD', { encoding: 'utf8' });
    return staged.split('\n').filter(f => f.endsWith('acceptance-test-plan.md')).map(f => join(REPO_ROOT, f));
  }
  catch {
    return null;
  }
}

function main() {
  const filterProject = (() => {
    const idx = process.argv.indexOf('--project');
    return idx !== -1 ? process.argv[idx + 1] : null;
  })();

  const staged = getStagedPlans();
  const plans = staged ?? walk(PBI_ROOT);
  const filtered = filterProject
    ? plans.filter((p) => {
        try { return readFileSync(p, 'utf8').includes(filterProject); }
        catch { return false; }
      })
    : plans;

  if (filtered.length === 0) {
    console.log('✓ xray:guard — no acceptance-test-plan.md to check');
    process.exit(0);
  }

  let errors = 0;
  let warns = 0;

  for (const file of filtered) {
    const rel = file.replace(`${REPO_ROOT}/`, '');
    const content = readFileSync(file, 'utf8');

    // 1. Must contain at least one TC01: should
    if (!TC_PATTERN.test(content)) {
      console.error(`✗ [ERROR] ${rel} — missing TC nomenclature "BK-XXX: TC01: should ..." (found T1 or no should)`);
      errors++;
    }

    // 2. Old T1 pattern without TC
    if (content.includes('**T1**') || content.includes('T2 —') || /\bT\d+\s+—/.test(content)) {
      // heuristic: if it has T1 but not TC01
      if (!content.includes('TC01')) {
        console.error(`✗ [ERROR] ${rel} — uses old T1/T2 without TC01 prefix`);
        errors++;
      }
    }

    // 3. Should mention ATS and ATP
    if (!ATS_PATTERN.test(content) && content.includes('Tests candidatos')) {
      console.error(`✗ [WARN] ${rel} — no ATS reference "ATS: BK-XXX:" (Set-first requires ATS→Story)`);
      warns++;
    }
    if (!ATP_PATTERN.test(content) && content.includes('Tests candidatos')) {
      console.error(`✗ [WARN] ${rel} — no ATP reference "ATP: BK-XXX:"`);
      warns++;
    }

    // 4. Direct TC→Story note should not be the recommended path
    if (content.includes('Tests se crean bajo') && content.includes('linkean a') && content.includes('directo')) {
      console.error(`✗ [WARN] ${rel} — documents direct TC→Story link (should be via ATS/ATP)`);
      warns++;
    }
  }

  if (errors > 0) {
    console.error(`\n✗ xray:guard — ERROR: ${errors}, WARN: ${warns}`);
    console.error('  Fix: use "BK-257: TC01: should ..." with leading zero + should, and ensure ATS: BK-XXX is documented/created before ATP/ATR.');
    console.error('  Ref: agentic-qa-core/references/traceability-linking.md:23 (ATS mandatory) + :59 (ATS→Story coverage)');
    process.exit(1);
  }

  if (warns > 0) {
    console.warn(`\n⚠ xray:guard — WARN: ${warns} (non-blocking)`);
  }

  console.log(`✓ xray:guard — pass (${filtered.length} plan(s) checked)`);
}

main();
