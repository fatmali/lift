import { createStore, del, get, set } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/**
 * IndexedDB-backed storage. Everything stays on the device — there is no
 * backend, and no request ever leaves the app.
 */
const store = createStore('lift-db', 'state');

export const idbStorage: StateStorage = {
  getItem: async (name) => (await get<string>(name, store)) ?? null,
  setItem: async (name, value) => {
    await set(name, value, store);
  },
  removeItem: async (name) => {
    await del(name, store);
  },
};

const photoStore = createStore('lift-photos', 'blobs');

export async function putPhoto(key: string, blob: Blob): Promise<void> {
  await set(key, blob, photoStore);
}

export async function getPhoto(key: string): Promise<Blob | undefined> {
  return get<Blob>(key, photoStore);
}

export async function removePhoto(key: string): Promise<void> {
  await del(key, photoStore);
}
