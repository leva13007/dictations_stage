import * as fs from "node:fs";
import * as fsPromises from "node:fs/promises";
import * as path from "node:path";
import "dotenv/config";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mp3Duration = require("mp3-duration");

/**
 * Full pipeline: parse Text.md → generate playlist.json/dic.json/index.json
 *                → ElevenLabs TTS → measure MP3 durations → update all files
 *
 * Usage:
 *   yarn tts <dic-id> [--voice <voice_id>]
 *
 * Examples:
 *   yarn tts 0007
 *   yarn tts 0007 --voice G7ILShrCNLfmS0A37SXS
 *
 * Env (.env):
 *   ELEVEN_API_KEY         required
 *   ELEVEN_VOICE_ID        default voice (overridden by --voice flag)
 *   ELEVEN_MODEL_ID        default: eleven_flash_v2_5
 *   ELEVEN_SPEED           default: 1.0
 *   ELEVEN_STABILITY       default: 0.5
 *   ELEVEN_SIMILARITY_BOOST default: 0.8
 */

// ── Voices map ───────────────────────────────────────────────────────

const VOICES: Record<string, string> = {
  G7ILShrCNLfmS0A37SXS: "Sam - Neutral, Friendly and Clear",
  "4CrZuIW9am7gYAxgo2Af": "Shelley - Clear, Confident and British",
  VsQmyFHffusQDewmHB5v: "Eddie Stirling - British Corporate, Clear & Reliable",
  // qxTFXDYbGcR8GaHSjczg: "James - Calm, Comforting and Gentle",
  oTQK6KgOJHp8UGGZjwUu: "Dexter - Dynamic, Bold and British",
  // BIvP0GN1cAtSRTxNHnWS: "Ellen - Serious, Direct and Confident",
  tnSpp4vdxKPjI9w0GnoV: "Hope - Upbeat and Clear",
  "1SM7GgM6IMuvQlz2BwM3": "Mark - Casual, Relaxed and Light",
  c6SfcYrb2t09NHXiT80T: "Jarnathan - Confident and Versatile",
};

const DEFAULT_VOICE_ID = Object.keys(VOICES)[0]; // G7ILShrCNLfmS0A37SXS

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

interface IndexEntry {
  id: string;
  path: string;
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
  repository: string;
  created_at: string;
  updated_at: string;
  dics: IndexEntry[];
}

// ── Helpers ──────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function getMp3Duration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    mp3Duration(filePath, (err: Error | null, duration: number) => {
      if (err) return reject(err);
      resolve(duration);
    });
  });
}

function parseTextMd(raw: string): { title: string; sentences: string[] } {
  const allLines = raw.split("\n").map((line) => line.trim());

  const separatorIndex = allLines.lastIndexOf("---");
  const sectionLines =
    separatorIndex !== -1 ? allLines.slice(separatorIndex + 1) : allLines;

  const lines = sectionLines.filter((line) => line.length > 0);

  if (lines.length === 0) {
    console.error("Error: Text.md is empty (or last section is empty)");
    process.exit(1);
  }

  const title = lines[0].replace(/^#+\s*/, "");
  const sentences = [title, ...lines.slice(1)];

  return { title, sentences };
}

function parseCli(): { dicId: string; voiceId: string } {
  const args = process.argv.slice(2);
  const dicId = args.find((a) => !a.startsWith("--"));

  if (!dicId) {
    console.error("Usage: yarn tts <dic-id> [--voice <voice_id>]");
    console.error("Example: yarn tts 0007 --voice G7ILShrCNLfmS0A37SXS");
    process.exit(1);
  }

  const voiceFlagIdx = args.indexOf("--voice");
  const voiceArg = voiceFlagIdx !== -1 ? args[voiceFlagIdx + 1] : undefined;

  const voiceId =
    voiceArg ?? process.env.ELEVEN_VOICE_ID ?? DEFAULT_VOICE_ID;

  if (!VOICES[voiceId]) {
    console.warn(`⚠️  Voice ID "${voiceId}" is not in the known voices map.`);
    console.warn(`   Known voices:\n${Object.entries(VOICES).map(([id, name]) => `     ${id}  ${name}`).join("\n")}`);
    console.warn("   Continuing anyway…");
  }

  return { dicId, voiceId };
}

// ── Phase A: generate playlist.json / dic.json / index.json ──────────

function phaseGen(
  dicId: string,
  dicDir: string,
  repoRoot: string
): { sentences: string[]; title: string } {
  console.log("\n── Phase A: Generating playlist.json / dic.json / index.json ──");

  const textPath = path.join(dicDir, "Text.md");
  const playlistPath = path.join(dicDir, "playlist.json");
  const dicJsonPath = path.join(dicDir, "dic.json");
  const indexPath = path.join(repoRoot, "dics", "index.json");

  if (!fs.existsSync(textPath)) {
    console.error(`Error: Text.md not found in ${dicDir}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(textPath, "utf-8");
  const { title, sentences } = parseTextMd(raw);

  if (!title) {
    console.error("Error: Title is empty in Text.md (first line must be # Title)");
    process.exit(1);
  }

  const sentenceCount = sentences.length;

  // Ensure sounds dir exists
  const soundsDir = path.join(dicDir, "sounds");
  if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true });
    console.log(`  📁 Created ${soundsDir}`);
  }

  // playlist.json
  const playlist: PlaylistEntry[] = sentences.map((text, index) => {
    const nn = String(index + 1).padStart(2, "0");
    return {
      id: index + 1,
      text,
      audio: `dics/${dicId}/sounds/${dicId}-${nn}.mp3`,
    };
  });

  fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2) + "\n", "utf-8");
  console.log(`  ✅ playlist.json (${sentenceCount} entries)`);

  // dic.json
  const now = new Date().toISOString();
  const dicMeta: DicMeta = {
    id: dicId,
    title,
    level: null,
    sentences: sentenceCount,
    duration_sec: null,
    voice: { voice_name: null, voice_id: null, provider: null, type: null },
    features: [],
    tags: [],
    video: null,
    created_at: now,
  };

  fs.writeFileSync(dicJsonPath, JSON.stringify(dicMeta, null, 2) + "\n", "utf-8");
  console.log(`  ✅ dic.json`);

  // index.json
  if (!fs.existsSync(indexPath)) {
    console.error(`Error: index.json not found at ${indexPath}`);
    process.exit(1);
  }

  const index: IndexFile = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  const existing = index.dics.find((d) => d.id === dicId);

  if (existing) {
    existing.path = `/dics/${dicId}/dic.json`;
    existing.title = title;
    existing.sentences = sentenceCount;
    console.log(`  ⚠️  ${dicId} already in index.json — updated`);
  } else {
    index.dics.push({
      id: dicId,
      path: `/dics/${dicId}/dic.json`,
      title,
      level: null,
      sentences: sentenceCount,
      duration_sec: null,
      tags: [],
      features: [],
      type: "general",
      has_video: null,
    });
    console.log(`  ✅ Added ${dicId} to index.json`);
  }

  index.updated_at = now;
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n", "utf-8");
  console.log(`  ✅ index.json updated`);

  return { sentences, title };
}

// ── Phase B: ElevenLabs TTS ──────────────────────────────────────────

async function ttsSentence(
  text: string,
  outputPath: string,
  voiceId: string,
  config: {
    apiKey: string;
    modelId: string;
    speed: number;
    stability: number;
    similarityBoost: number;
  }
): Promise<void> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const body = {
    model_id: config.modelId,
    text,
    voice_settings: {
      stability: config.stability,
      similarity_boost: config.similarityBoost,
      speed: config.speed,
    },
    output_format: "mp3_44100_128",
  };

  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.status === 429) throw new Error("429 Too Many Requests");
      if (!res.ok) throw new Error(`TTS error ${res.status}: ${await res.text()}`);

      const arrayBuf = await res.arrayBuffer();
      await fsPromises.writeFile(outputPath, Buffer.from(arrayBuf));
      return;
    } catch (e) {
      attempt++;
      if (attempt >= 3) throw e;
      const wait = Math.min(2000 * attempt, 8000);
      const err = e as Error;
      console.warn(`  [retry ${attempt}] ${err.message} — waiting ${wait}ms`);
      await sleep(wait);
    }
  }
}

async function phaseTts(
  dicId: string,
  dicDir: string,
  sentences: string[],
  voiceId: string
): Promise<void> {
  console.log(`\n── Phase B: TTS via ElevenLabs (voice: ${VOICES[voiceId] ?? voiceId}) ──`);

  const apiKey = process.env.ELEVEN_API_KEY;
  if (!apiKey) {
    console.error("Error: ELEVEN_API_KEY is not set in .env");
    process.exit(1);
  }

  const config = {
    apiKey,
    modelId: process.env.ELEVEN_MODEL_ID ?? "eleven_flash_v2_5",
    speed: parseFloat(process.env.ELEVEN_SPEED ?? "1.0"),
    stability: parseFloat(process.env.ELEVEN_STABILITY ?? "0.5"),
    similarityBoost: parseFloat(process.env.ELEVEN_SIMILARITY_BOOST ?? "0.8"),
  };

  const soundsDir = path.join(dicDir, "sounds");
  const CONCURRENCY = 2;
  let i = 0;

  async function worker() {
    while (i < sentences.length) {
      const idx = i++;
      const text = sentences[idx];
      const nn = String(idx + 1).padStart(2, "0");
      const outputPath = path.join(soundsDir, `${dicId}-${nn}.mp3`);

      try {
        await ttsSentence(text, outputPath, voiceId, config);
        const preview = text.length > 70 ? text.slice(0, 70) + "…" : text;
        console.log(`  ✅ [${nn}] ${preview}`);
      } catch (err) {
        const e = err as Error;
        console.error(`  ✖ [${nn}] ${e.message}`);
      }

      await sleep(200);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, sentences.length) }, () => worker())
  );
}

// ── Phase C: measure durations and update all files ──────────────────

async function phaseDurations(
  dicId: string,
  dicDir: string,
  repoRoot: string,
  voiceId: string
): Promise<void> {
  console.log("\n── Phase C: Measuring MP3 durations ──");

  const soundsDir = path.join(dicDir, "sounds");
  const playlistPath = path.join(dicDir, "playlist.json");
  const dicJsonPath = path.join(dicDir, "dic.json");
  const indexPath = path.join(repoRoot, "dics", "index.json");

  const playlist: PlaylistEntry[] = JSON.parse(fs.readFileSync(playlistPath, "utf-8"));

  let totalDuration = 0;

  for (const entry of playlist) {
    const audioPath = path.join(repoRoot, entry.audio);

    if (!fs.existsSync(audioPath)) {
      console.warn(`  ⚠️  Skipping missing file: ${entry.audio}`);
      continue;
    }

    const duration = await getMp3Duration(audioPath);
    entry.duration_sec = round2(duration);
    totalDuration += duration;
    console.log(`  ${String(entry.id).padStart(2, "0")} → ${entry.duration_sec}s`);
  }

  const totalRounded = round2(totalDuration);

  // Update playlist.json
  fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2) + "\n", "utf-8");
  console.log(`\n  ✅ playlist.json updated`);

  // Update dic.json — also fill voice info
  const dicMeta: DicMeta = JSON.parse(fs.readFileSync(dicJsonPath, "utf-8"));
  dicMeta.duration_sec = totalRounded;
  dicMeta.voice = {
    voice_id: voiceId,
    voice_name: VOICES[voiceId] ?? null,
    provider: "ElevenLabs",
    type: null, // fill manually
  };

  fs.writeFileSync(dicJsonPath, JSON.stringify(dicMeta, null, 2) + "\n", "utf-8");
  console.log(`  ✅ dic.json updated (total: ${totalRounded}s, voice: ${dicMeta.voice.voice_name ?? voiceId})`);

  // Update index.json
  const index: IndexFile = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  const entry = index.dics.find((d) => d.id === dicId);
  if (entry) {
    entry.duration_sec = totalRounded;
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n", "utf-8");
    console.log(`  ✅ index.json updated`);
  } else {
    console.warn(`  ⚠️  ${dicId} not found in index.json — skipping duration update`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { dicId, voiceId } = parseCli();

  const repoRoot = path.resolve(__dirname, "..");
  const dicDir = path.join(repoRoot, "dics", dicId);

  // Validate dic folder exists
  if (!fs.existsSync(dicDir)) {
    console.error(`Error: Dictation folder not found: ${dicDir}`);
    process.exit(1);
  }

  // Guard: if sounds/*.mp3 already exist, abort
  // TODO: add --force flag to allow regeneration
  const soundsDir = path.join(dicDir, "sounds");
  if (fs.existsSync(soundsDir)) {
    const existingMp3s = fs.readdirSync(soundsDir).filter((f) => f.endsWith(".mp3"));
    if (existingMp3s.length > 0) {
      console.error(`Error: ${existingMp3s.length} MP3 file(s) already exist in ${soundsDir}`);
      console.error("  Remove them manually before re-running, or use --force (not yet implemented).");
      process.exit(1);
    }
  }

  console.log(`\n🎙️  Generating dictation "${dicId}" with voice: ${VOICES[voiceId] ?? voiceId}`);

  const { sentences, title } = phaseGen(dicId, dicDir, repoRoot);
  await phaseTts(dicId, dicDir, sentences, voiceId);
  await phaseDurations(dicId, dicDir, repoRoot, voiceId);

  console.log(`\n🎉 Done! Dictation "${title}" (${dicId}) is ready.`);
  console.log(`   Fill in dic.json manually: level, tags, video, voice.type`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
