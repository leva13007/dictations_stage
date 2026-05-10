import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Reads a Text.md file from a dictation folder and generates:
 *   - playlist.json  (sentence list with audio paths)
 *   - dic.json       (dictation metadata)
 * Also adds a record to dics/index.json.
 *
 * Usage:
 *   npx tsx src/generate-playlist.ts <dic-id>
 *
 * Example:
 *   npx tsx src/generate-playlist.ts 0006
 */

// ── Types ────────────────────────────────────────────────────────────

interface PlaylistEntry {
  id: number;
  text: string;
  audio: string;
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

interface IndexEntry {
  id: string;
  title: string;
  level: string | null;
  sentences: number;
  duration_sec: number | null;
  tags: string[];
  features: string[];
  type: string;
  has_video: boolean | null;
}

interface IndexFile {
  language: string;
  url: string;
  api: { index: string };
  repository: string;
  created_at: string;
  updated_at: string;
  dics: IndexEntry[];
}

// ── Helpers ──────────────────────────────────────────────────────────

function parseTextMd(raw: string): { title: string; sentences: string[] } {
  const allLines = raw.split("\n").map((line) => line.trim());

  // If there is a "---" separator, use only the last section
  const separatorIndex = allLines.lastIndexOf("---");
  const sectionLines =
    separatorIndex !== -1 ? allLines.slice(separatorIndex + 1) : allLines;

  const lines = sectionLines.filter((line) => line.length > 0);

  if (lines.length === 0) {
    console.error("Error: Text.md is empty (or last section is empty)");
    process.exit(1);
  }

  // First line is the title (strip leading "# ")
  const title = lines[0].replace(/^#+\s*/, "");
  const sentences = [title, ...lines.slice(1)];

  return { title, sentences };
}

// ── Main ─────────────────────────────────────────────────────────────

function main(): void {
  const dicId = process.argv[2];

  if (!dicId) {
    console.error("Usage: npx tsx src/generate-playlist.ts <dic-id>");
    console.error("Example: npx tsx src/generate-playlist.ts 0006");
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const dicDir = path.join(repoRoot, "dics", dicId);
  const textPath = path.join(dicDir, "Text.md");
  const playlistPath = path.join(dicDir, "playlist.json");
  const dicJsonPath = path.join(dicDir, "dic.json");
  const indexPath = path.join(repoRoot, "dics", "index.json");

  // ── Validate ────────────────────────────────────────────────────

  if (!fs.existsSync(dicDir)) {
    console.error(`Error: Dictation folder not found: ${dicDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(textPath)) {
    console.error(`Error: Text.md not found in ${dicDir}`);
    process.exit(1);
  }

  // ── Parse Text.md ───────────────────────────────────────────────

  const raw = fs.readFileSync(textPath, "utf-8");
  const { title, sentences } = parseTextMd(raw);
  const sentenceCount = sentences.length;

  // ── Ensure sounds folder exists ─────────────────────────────────

  const soundsDir = path.join(dicDir, "sounds");
  if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true });
    console.log(`📁 Created ${soundsDir}`);
  }

  // ── Generate playlist.json ──────────────────────────────────────

  const playlist: PlaylistEntry[] = sentences.map((text, index) => {
    const sentenceNum = String(index + 1).padStart(2, "0");
    return {
      id: index + 1,
      text,
      audio: `${dicId}-${sentenceNum}.mp3`,
    };
  });

  fs.writeFileSync(
    playlistPath,
    JSON.stringify(playlist, null, 2) + "\n",
    "utf-8"
  );
  console.log(`✅ Generated ${playlistPath} (${sentenceCount} entries)`);

  // ── Generate dic.json ───────────────────────────────────────────

  const now = new Date().toISOString();

  const dicMeta: DicMeta = {
    id: dicId,
    title,
    level: null,
    sentences: sentenceCount,
    duration_sec: null,
    voice: {
      voice_name: null,
      voice_id: null,
      provider: null,
      type: null,
    },
    features: [],
    tags: [],
    video: null,
    created_at: now,
  };

  fs.writeFileSync(
    dicJsonPath,
    JSON.stringify(dicMeta, null, 2) + "\n",
    "utf-8"
  );
  console.log(`✅ Generated ${dicJsonPath}`);

  // ── Update index.json ───────────────────────────────────────────

  if (!fs.existsSync(indexPath)) {
    console.error(`Error: index.json not found at ${indexPath}`);
    process.exit(1);
  }

  const index: IndexFile = JSON.parse(fs.readFileSync(indexPath, "utf-8"));

  // Check if this dic already exists in the index
  const existing = index.dics.find((d) => d.id === dicId);
  if (existing) {
    console.log(`⚠️  Dictation ${dicId} already exists in index.json — updating it`);
    existing.title = title;
    existing.sentences = sentenceCount;
  } else {
    const newEntry: IndexEntry = {
      id: dicId,
      title,
      level: null,
      sentences: sentenceCount,
      duration_sec: null,
      tags: [],
      features: [],
      type: "general",
      has_video: null,
    };
    index.dics.push(newEntry);
    console.log(`✅ Added ${dicId} to index.json`);
  }

  // Update the timestamp
  index.updated_at = now;

  fs.writeFileSync(
    indexPath,
    JSON.stringify(index, null, 2) + "\n",
    "utf-8"
  );
  console.log(`✅ Updated ${indexPath}`);

  console.log(`\n🎉 Done! Dictation "${title}" (${dicId}) is ready.`);
}

main();
