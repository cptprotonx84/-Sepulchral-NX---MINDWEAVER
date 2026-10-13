const DB_NAME = 'mindweaver-image-assets';
const STORE_NAME = 'images';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export interface ExportedImageAsset {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
}

interface StoredImageAsset {
  id: string;
  name: string;
  mimeType: string;
  blob: Blob;
}

const openImageDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error('Local image storage is unavailable.'));
});

const requestAsset = async (id: string): Promise<StoredImageAsset | undefined> => {
  const db = await openImageDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as StoredImageAsset | undefined);
    request.onerror = () => reject(request.error ?? new Error('Image could not be read.'));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => db.close();
  });
};

const putAsset = async (asset: StoredImageAsset): Promise<void> => {
  const db = await openImageDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(asset);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error('Image could not be saved.')); };
  });
};

export const saveNodeImage = async (file: File): Promise<string> => {
  if (!SUPPORTED_TYPES.has(file.type)) throw new Error('Choose a PNG, JPEG, WebP, or GIF image.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Images must be 10 MB or smaller.');
  const id = `img_${crypto.randomUUID()}`;
  await putAsset({ id, name: file.name, mimeType: file.type, blob: file });
  return id;
};

export const getNodeImage = async (id: string): Promise<Blob | undefined> => (await requestAsset(id))?.blob;

const blobToDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error ?? new Error('Image could not be exported.'));
  reader.readAsDataURL(blob);
});

export const exportImageAssets = async (ids: Iterable<string>): Promise<ExportedImageAsset[]> => {
  const results: ExportedImageAsset[] = [];
  for (const id of new Set(ids)) {
    const asset = await requestAsset(id);
    if (!asset) throw new Error(`An attached image (${id}) is missing from local storage. Backup was cancelled.`);
    results.push({ id, name: asset.name, mimeType: asset.mimeType, dataUrl: await blobToDataUrl(asset.blob) });
  }
  return results;
};

export const importImageAssets = async (assets: ExportedImageAsset[]): Promise<void> => {
  for (const asset of assets) {
    if (!asset || typeof asset.id !== 'string' || !asset.id.startsWith('img_')
      || typeof asset.name !== 'string' || !SUPPORTED_TYPES.has(asset.mimeType)
      || typeof asset.dataUrl !== 'string' || !asset.dataUrl.startsWith(`data:${asset.mimeType};base64,`)) {
      throw new Error('Backup contains an invalid image attachment.');
    }
    const blob = await (await fetch(asset.dataUrl)).blob();
    if (blob.size > MAX_IMAGE_BYTES || blob.size === 0) throw new Error('Backup contains an invalid or oversized image.');
    await putAsset({ id: asset.id, name: asset.name, mimeType: asset.mimeType, blob });
  }
};
