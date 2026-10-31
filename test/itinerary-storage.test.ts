import { describe, expect, it } from 'vitest';
import {
  parseSavedItineraries,
  readSavedItineraries,
  serializeItinerary,
  STORAGE_KEY,
  StorageLike,
  writeSavedItineraries,
} from '../src/lib/itineraryStorage';

const makeStorage = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
};

describe('serializeItinerary', () => {
  it('keeps only station ids', () => {
    const saved = serializeItinerary(
      {
        start: { id: 's1' } as never,
        end: { id: 's3' } as never,
        steps: [{ id: 's2' } as never],
      },
      'Traversée du Nord',
      'abc',
      '2026-10-31T12:00:00.000Z',
    );
    expect(saved).toEqual({
      id: 'abc',
      name: 'Traversée du Nord',
      savedAt: '2026-10-31T12:00:00.000Z',
      startId: 's1',
      endId: 's3',
      stepIds: ['s2'],
    });
  });

  it('omits missing start/end', () => {
    const saved = serializeItinerary({ steps: [] }, 'Brouillon', 'x', '2026-10-31T12:00:00.000Z');
    expect(saved.startId).toBeUndefined();
    expect(saved.endId).toBeUndefined();
  });
});

describe('parseSavedItineraries', () => {
  it('returns an empty list for null or invalid JSON', () => {
    expect(parseSavedItineraries(null)).toEqual([]);
    expect(parseSavedItineraries('not json')).toEqual([]);
    expect(parseSavedItineraries('{"a":1}')).toEqual([]);
  });

  it('drops invalid entries but keeps valid ones', () => {
    const json = JSON.stringify([
      { id: 'ok', name: 'A', savedAt: '2026-10-31T12:00:00.000Z', stepIds: ['s1'], startId: 's1' },
      { id: 'bad', name: 'B' },
      'garbage',
    ]);
    const parsed = parseSavedItineraries(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('ok');
  });
});

describe('read/writeSavedItineraries', () => {
  it('round-trips through a StorageLike', () => {
    const storage = makeStorage();
    expect(readSavedItineraries(storage)).toEqual([]);
    const entry = serializeItinerary({ steps: [{ id: 's1' } as never] }, 'A', 'id-1', '2026-10-31T12:00:00.000Z');
    writeSavedItineraries(storage, [entry]);
    expect(storage.data.has(STORAGE_KEY)).toBe(true);
    expect(readSavedItineraries(storage)).toEqual([entry]);
  });
});
