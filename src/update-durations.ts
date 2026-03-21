import * as fs from "node:fs";
import * as path from "node:path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mp3Duration = require("mp3-duration");

/**
 * Reads all MP3 files in dics/<id>/sounds/, measures their durations,
 * and updates:
 *   - playlist.json  → adds/updates "duration_sec" per item
 *   - dic.json       → sets "duration_sec" to the total
 *
 * Usage:
 *   npx tsx src/update-durations.ts <dic-id>
 *
 * Example:
 *   npx tsx src/update-durations.ts 0004
 */

// ── Types ────────────────────────────────────────────────────────────

interface PlaylistEntry {
  id: number;
  text: string;
  audio: string;
  duration_sec?: number;
}

interface DicMeta {
  id: string;
  title: string;
  level: string | null;
  sentences: number;
  duration_sec: number | null;
  voice: {
    voice_name: string | null;
    voice_id: string | null;
    provider: string | null;
    type: string | null;
  };
  features: string[];
  tags: string[];
  video: string | null;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

function getDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    mp3Duration(filePath, (err: Error | null, duration: number) => {
      if (err) return reject(err);
      resolve(duration);
    });
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const dicId = process.argv[2];

  if (!dicId) {
    console.error("Usage: npx tsx src/update-durations.ts <dic-id>");
    console.error("Example: npx tsx src/update-durations.ts 0004");
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const dicDir = path.join(repoRoot, "dics", dicId);
  const soundsDir = path.join(dicDir, "sounds");
  const playlistPath = path.join(dicDir, "playlist.json");
  const dicJsonPath = path.join(dicDir, "dic.json");
  const indexPath = path.join(repoRoot, "dics", "index.json");

  // ── Validate ────────────────────────────────────────────────────

  if (!fs.existsSync(soundsDir)) {
    console.error(`Error: sounds folder not found: ${soundsDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(playlistPath)) {
    console.error(`Error: playlist.json not found: ${playlistPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(dicJsonPath)) {
    console.error(`Error: dic.json not found: ${dicJsonPath}`);
    process.exit(1);
  }

  // ── Read playlist ───────────────────────────────────────────────

  const playlist: PlaylistEntry[] = JSON.parse(
    fs.readFileSync(playlistPath, "utf-8")
  );

  // ── Measure durations ──────────────────────────────────────────

  let totalDuration = 0;

  for (const entry of playlist) {
    const audioPath = path.join(repoRoot, entry.audio);

    if (!fs.existsSync(audioPath)) {
      console.warn(`⚠️  Audio file not found, skipping: ${entry.audio}`);
      continue;
    }

    const duration = await getDuration(audioPath);
    entry.duration_sec = round2(duration);
    totalDuration += duration;

    console.log(
      `  ${entry.audio} → ${entry.duration_sec}s`
    );
  }

  const totalRounded = round2(totalDuration);

  // ── Write updated playlist.json ─────────────────────────────────

  fs.writeFileSync(
    playlistPath,
    JSON.stringify(playlist, null, 2) + "\n",
    "utf-8"
  );
  console.log(`\n✅ Updated ${playlistPath}`);

  // ── Update dic.json ─────────────────────────────────────────────

  const dicMeta: DicMeta = JSON.parse(fs.readFileSync(dicJsonPath, "utf-8"));
  dicMeta.duration_sec = totalRounded;

  fs.writeFileSync(
    dicJsonPath,
    JSON.stringify(dicMeta, null, 2) + "\n",
    "utf-8"
  );
  console.log(`✅ Updated ${dicJsonPath} (total: ${totalRounded}s)`);

  // ── Update index.json ───────────────────────────────────────────

  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const entry = index.dics?.find((d: { id: string }) => d.id === dicId);
    if (entry) {
      entry.duration_sec = totalRounded;
      fs.writeFileSync(
        indexPath,
        JSON.stringify(index, null, 2) + "\n",
        "utf-8"
      );
      console.log(`✅ Updated ${indexPath}`);
    } else {
      console.warn(`⚠️  Dictation ${dicId} not found in index.json`);
    }
  }
}

main();
