#!/usr/bin/env bun
/**
 * sync-opencode-commands.ts — port .claude/commands/*.md → .opencode/commands/*.md
 *
 * Runs automatically after `bun run up` (chained in package.json) to keep the
 * OpenCode custom commands in sync with the Claude Code ones the boilerplate
 * ships. opencode does NOT read .claude/commands/, so every upstream command
 * must be mirrored into .opencode/commands/ with the opencode frontmatter
 * contract (description + subtask: true) and the Claude Code frontmatter
 * fields (name / license / compatibility) stripped.
 *
 * Idempotent: writes a target only when the generated output differs from what
 * is already on disk. Safe in dry-run mode (never mutates). Safe to re-run.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

interface ParsedCommand {
  description: string;
  body: string;
}

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, '.claude', 'commands');
const OUT_DIR = join(ROOT, '.opencode', 'commands');
const DRY_RUN = process.argv.includes('--dry-run');

function fail(msg: string): never {
  console.error(`[sync-opencode-commands] ${msg}`);
  process.exit(1);
}

/** Parse a Claude Code command file into { description, body } in opencode format. */
function parseCommand(filePath: string): ParsedCommand {
  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  // Claude Code frontmatter: `---` ... `---` at the very top.
  let description = '';
  let bodyStart = 0;
  if (lines[0]?.trim() === '---') {
    const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
    if (endIdx === -1) {
      fail(`frontmatter sin cierre en ${filePath}`);
    }
    const fm = lines.slice(1, endIdx);
    for (const line of fm) {
      const m = line.match(/^description:\s*(.*)$/);
      if (m) {
        description = m[1].trim();
        break;
      }
    }
    bodyStart = endIdx + 1;
  }

  // No frontmatter / no description → fall back to the first heading.
  if (!description) {
    const heading = lines.find(l => /^#\s+/.test(l));
    if (heading) {
      description = heading.replace(/^#\s+/, '').trim();
    }
  }
  if (!description) {
    fail(`no se pudo derivar description de ${filePath}`);
  }

  const body = lines.slice(bodyStart).join('\n').replace(/^\n+/, '').trimEnd();
  return { description, body };
}

/** Extract the body (everything after the leading frontmatter block) of a target file. */
function extractTargetBody(filePath: string): string {
  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() === '---') {
    const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
    if (endIdx !== -1) {
      return lines.slice(endIdx + 1).join('\n').replace(/^\n+/, '').trimEnd();
    }
  }
  return raw.trimEnd();
}

/** Render the opencode command file (frontmatter contract + body). */
function renderTarget(parsed: ParsedCommand): string {
  const escaped = parsed.description.replace(/"/g, '\\"');
  return `---\ndescription: ${escaped}\nsubtask: true\n---\n\n${parsed.body}\n`;
}

/** sha256 of the source file — used to skip untouched sources cheaply. */
function sourceDigest(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function main(): void {
  if (!existsSync(SRC_DIR)) {
    console.log('[sync-opencode-commands] .claude/commands/ no existe — nada que sincronizar.');
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const sources = readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  const stats = { created: 0, updated: 0, unchanged: 0 };
  const lines: string[] = [];

  for (const file of sources) {
    const srcPath = join(SRC_DIR, file);
    const outPath = join(OUT_DIR, file);
    const digest = sourceDigest(srcPath);
    const parsed = parseCommand(srcPath);
    const target = renderTarget(parsed);

    const relativeOut = relative(ROOT, outPath).replace(/\\/g, '/');

    if (!existsSync(outPath)) {
      if (DRY_RUN) {
        stats.created += 1;
        lines.push(`  [dry-run] crearía: ${relativeOut}`);
        continue;
      }
      writeFileSync(outPath, target);
      stats.created += 1;
      lines.push(`  [sync] creado: ${relativeOut}`);
      continue;
    }

    // Preserve the existing frontmatter (hand-tuned descriptions) when the
    // BODY is unchanged — only the body reflects upstream content. Regenerate
    // only when the body actually drifted.
    if (extractTargetBody(outPath) === parsed.body) {
      stats.unchanged += 1;
      continue;
    }

    if (DRY_RUN) {
      stats.updated += 1;
      lines.push(`  [dry-run] actualizaría: ${relativeOut}`);
      continue;
    }
    writeFileSync(outPath, target);
    stats.updated += 1;
    lines.push(`  [sync] actualizado: ${relativeOut} (${digest.slice(0, 8)})`);
  }

  if (lines.length > 0) {
    console.log(`[sync-opencode-commands] Commands en ${SRC_DIR}:`);
    for (const l of lines) console.log(l);
  }

  console.log(
    `[sync-opencode-commands] listo — creados: ${stats.created}, actualizados: ${stats.updated}, sin cambios: ${stats.unchanged}`,
  );
}

// Guard so the pure helpers can be imported by tests without running the CLI.
if ((import.meta as { main?: boolean }).main) {
  main();
}
