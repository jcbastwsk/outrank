/**
 * Regression floor for the coach. Goldens fail the process.
 * Curator packs print as advisory mismatches and do not fail.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SAMPLE_DRAFTS } from "../src/lib/coach";
import { scoreDraft, type ScoreResult } from "../src/lib/score";
import type { CaseRecord } from "../src/lib/curation";

type SampleRule = {
  label: string;
  lane?: string;
  tribe?: string;
  format?: string;
  grades?: string[];
  forbidGrades?: string[];
  forbidLanes?: string[];
  reachMin?: number;
  reachMax?: number;
  wall?: boolean;
  openLoop?: boolean;
  cursed?: boolean;
  costume?: boolean;
  ledeWeak?: boolean;
};

type LockRule = SampleRule & { id: string; text: string; why?: string };

type Goldens = {
  samples: SampleRule[];
  locks: LockRule[];
};

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function check(rule: SampleRule, s: ScoreResult): string[] {
  const bad: string[] = [];
  if (rule.lane && s.lane.id !== rule.lane) bad.push(`lane ${s.lane.id} ≠ ${rule.lane}`);
  if (rule.tribe && s.tribe !== rule.tribe) bad.push(`tribe ${s.tribe} ≠ ${rule.tribe}`);
  if (rule.format && s.format !== rule.format) bad.push(`format ${s.format} ≠ ${rule.format}`);
  if (rule.grades && !rule.grades.includes(s.grade)) {
    bad.push(`grade ${s.grade} not in ${rule.grades.join("|")}`);
  }
  if (rule.forbidGrades?.includes(s.grade)) bad.push(`grade ${s.grade} forbidden`);
  if (rule.forbidLanes?.includes(s.lane.id)) bad.push(`lane ${s.lane.id} forbidden`);
  if (rule.reachMin != null && s.reach < rule.reachMin) {
    bad.push(`reach ${s.reach} < ${rule.reachMin}`);
  }
  if (rule.reachMax != null && s.reach > rule.reachMax) {
    bad.push(`reach ${s.reach} > ${rule.reachMax}`);
  }
  if (rule.wall != null && s.features.wall !== rule.wall) {
    bad.push(`wall ${s.features.wall} ≠ ${rule.wall}`);
  }
  if (rule.openLoop != null && s.features.openLoop !== rule.openLoop) {
    bad.push(`openLoop ${s.features.openLoop} ≠ ${rule.openLoop}`);
  }
  if (rule.cursed != null && s.features.cursed !== rule.cursed) {
    bad.push(`cursed ${s.features.cursed} ≠ ${rule.cursed}`);
  }
  if (rule.costume != null && s.features.costume !== rule.costume) {
    bad.push(`costume ${s.features.costume} ≠ ${rule.costume}`);
  }
  if (rule.ledeWeak != null && s.features.ledeWeak !== rule.ledeWeak) {
    bad.push(`ledeWeak ${s.features.ledeWeak} ≠ ${rule.ledeWeak}`);
  }
  return bad;
}

function line(label: string, s: ScoreResult, extra = "") {
  return `${label.padEnd(22)} ${s.lane.id.padEnd(10)} ${s.format.padEnd(8)} ${s.grade} ${String(s.reach).padStart(3)}${extra}`;
}

function parseCases(raw: unknown): CaseRecord[] {
  if (Array.isArray(raw)) return raw as CaseRecord[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { cases?: unknown }).cases)) {
    return (raw as { cases: CaseRecord[] }).cases;
  }
  return [];
}

function packMismatch(c: CaseRecord, s: ScoreResult): string | null {
  const diedHigh = c.outcome === "died" && (s.grade === "A" || s.grade === "S");
  const blewLow = c.outcome === "blew_up" && (s.grade === "D" || s.grade === "F");
  const laneOff = c.laneOverride && c.laneOverride !== s.lane.id;
  if (!diedHigh && !blewLow && !laneOff) return null;
  const bits = [
    diedHigh ? "died but coach printed A/S" : "",
    blewLow ? "blew up but coach printed D/F" : "",
    laneOff ? `human lane ${c.laneOverride} vs ${s.lane.id}` : "",
  ].filter(Boolean);
  return bits.join("; ");
}

async function loadPacks(): Promise<{ file: string; cases: CaseRecord[] }[]> {
  const out: { file: string; cases: CaseRecord[] }[] = [];
  const dirs = [
    path.join(root, "research", "packs"),
    path.join(root, "data"),
  ];
  for (const dir of dirs) {
    let names: string[] = [];
    try {
      names = await readdir(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      if (dir.endsWith("data") && name !== "curation.json") continue;
      const file = path.join(dir, name);
      try {
        const cases = parseCases(JSON.parse(await readFile(file, "utf8")));
        if (cases.length) out.push({ file, cases });
      } catch {
        // skip junk
      }
    }
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const scoreIdx = args.indexOf("--score");
  if (scoreIdx !== -1) {
    const text = args.slice(scoreIdx + 1).join(" ").trim();
    if (!text) {
      console.error("usage: npm run rd:fixtures -- --score \"draft\"");
      process.exit(2);
    }
    const s = scoreDraft(text);
    console.log(
      JSON.stringify(
        {
          lane: s.lane.id,
          tribe: s.tribe,
          format: s.format,
          grade: s.grade,
          reach: s.reach,
          wall: s.features.wall,
          costume: s.features.costume,
          headline: s.headline,
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  const goldens = JSON.parse(
    await readFile(path.join(root, "research", "goldens.json"), "utf8"),
  ) as Goldens;

  let failed = 0;
  console.log("SAMPLE");
  for (const rule of goldens.samples) {
    const draft = SAMPLE_DRAFTS.find((d) => d.label === rule.label);
    if (!draft) {
      console.log(`FAIL  ${rule.label}  missing from SAMPLE_DRAFTS`);
      failed += 1;
      continue;
    }
    const s = scoreDraft(draft.text);
    const bad = check(rule, s);
    if (bad.length) {
      console.log(`FAIL  ${line(rule.label, s)}  ${bad.join("; ")}`);
      failed += 1;
    } else {
      console.log(`ok    ${line(rule.label, s)}`);
    }
  }

  console.log("LOCKS");
  for (const rule of goldens.locks) {
    const s = scoreDraft(rule.text);
    const bad = check(rule, s);
    if (bad.length) {
      console.log(`FAIL  ${line(rule.id, s)}  ${bad.join("; ")}`);
      failed += 1;
    } else {
      console.log(`ok    ${line(rule.id, s)}`);
    }
  }

  const packs = await loadPacks();
  let advisory = 0;
  if (packs.length) {
    console.log("PACKS (advisory)");
    for (const pack of packs) {
      for (const c of pack.cases) {
        if (!c.text) continue;
        const s = scoreDraft(c.text);
        const why = packMismatch(c, s);
        if (why) {
          advisory += 1;
          console.log(`MISS  ${line(c.outcome, s)}  ${why}`);
        }
      }
    }
    if (advisory === 0) console.log("ok    no outcome mismatches");
  }

  console.log(
    failed === 0
      ? `PASS  ${goldens.samples.length + goldens.locks.length} goldens` +
          (advisory ? `  ${advisory} pack mismatch(es)` : "")
      : `FAIL  ${failed} golden(s)`,
  );
  process.exit(failed === 0 ? 0 : 1);
}

main();
