// Local video storage for trainee set videos (IndexedDB — localStorage can't hold blobs).
const DB_NAME = "st_videos";
const STORE = "videos";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = fn(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 5 * 60;
export const ACCEPTED_VIDEO_TYPES = "video/mp4,video/webm,video/quicktime";

export async function saveVideo(id: string, file: Blob): Promise<void> {
  await tx("readwrite", (s) => s.put(file, id));
}

export async function loadVideo(id: string): Promise<Blob | null> {
  const blob = await tx<Blob | undefined>("readonly", (s) => s.get(id));
  return blob ?? null;
}

export async function deleteVideo(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

export function videoDuration(file: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(el.duration || 0);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    el.src = url;
  });
}