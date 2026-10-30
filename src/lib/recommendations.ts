import { del, get, list, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

export type SongRecommendation = {
  id: string;
  trackId: string;
  trackName: string;
  artists: string;
  albumImage?: string;
  spotifyUrl?: string;
  fromName: string;
  note: string;
  createdAt: string;
};

const BLOB_PREFIX = "recommendations/";
const LOCAL_PATH = join(process.cwd(), ".data", "recommendations.json");

function hasBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readLocal(): Promise<SongRecommendation[]> {
  try {
    const raw = await readFile(LOCAL_PATH, "utf8");
    return JSON.parse(raw) as SongRecommendation[];
  } catch {
    return [];
  }
}

async function writeLocal(items: SongRecommendation[]) {
  await mkdir(join(process.cwd(), ".data"), { recursive: true });
  await writeFile(LOCAL_PATH, JSON.stringify(items, null, 2));
}

export async function listRecommendations(): Promise<SongRecommendation[]> {
  if (!hasBlob()) {
    const items = await readLocal();
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { blobs } = await list({ prefix: BLOB_PREFIX, limit: 100 });
  const items: SongRecommendation[] = [];
  for (const blob of blobs) {
    try {
      const result = await get(blob.pathname, { access: "private" });
      if (!result?.stream) continue;
      const text = await new Response(result.stream).text();
      items.push(JSON.parse(text) as SongRecommendation);
    } catch {
      // skip bad blobs
    }
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addRecommendation(
  input: Omit<SongRecommendation, "id" | "createdAt">,
): Promise<SongRecommendation> {
  const item: SongRecommendation = {
    ...input,
    id: `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    fromName: input.fromName.trim().slice(0, 40) || "Someone on LinkedIn",
    note: input.note.trim().slice(0, 160),
  };

  if (!hasBlob()) {
    const items = await readLocal();
    items.unshift(item);
    await writeLocal(items.slice(0, 100));
    return item;
  }

  await put(`${BLOB_PREFIX}${item.id}.json`, JSON.stringify(item), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return item;
}

export async function deleteRecommendation(id: string) {
  if (!hasBlob()) {
    const items = (await readLocal()).filter((i) => i.id !== id);
    await writeLocal(items);
    return;
  }
  await del(`${BLOB_PREFIX}${id}.json`);
}
