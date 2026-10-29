import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { join } from 'node:path';
import { DATA_SOURCES, RAW_DIR, type DataSource } from './config';

export async function fetchDataSource(source: DataSource): Promise<void> {
  const response = await fetch(source.url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${source.name}: HTTP ${response.status}`);
  }
  await mkdir(RAW_DIR, { recursive: true });
  const destination = join(RAW_DIR, source.file);
  await pipeline(
    Readable.fromWeb(response.body as unknown as NodeReadableStream),
    createWriteStream(destination),
  );
  console.log(`Downloaded ${source.name} -> ${destination}`);
}

export async function fetchAll(): Promise<void> {
  for (const source of DATA_SOURCES) {
    await fetchDataSource(source);
  }
}

if (require.main === module) {
  fetchAll().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
