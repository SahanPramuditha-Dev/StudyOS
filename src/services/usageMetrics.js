import { STORAGE_KEYS } from './storage';

const ASSET_KEYS = [STORAGE_KEYS.RESOURCES, STORAGE_KEYS.NOTES, STORAGE_KEYS.PAPERS];

const parseMB = (sizeValue) => {
  if (typeof sizeValue === 'number') return sizeValue;
  if (typeof sizeValue !== 'string') return 0;
  const match = sizeValue.trim().match(/^([\d.]+)\s*(kb|mb|gb)?$/i);
  if (!match) return 0;
  const num = Number(match[1] || 0);
  const unit = (match[2] || 'mb').toLowerCase();
  if (Number.isNaN(num)) return 0;
  if (unit === 'kb') return num / 1024;
  if (unit === 'gb') return num * 1024;
  return num;
};

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const countValidItems = (items) => items.filter((item) => item && (item.id || item.uid)).length;

const estimateCollectionSizeMB = (items) => {
  try {
    return JSON.stringify(items || []).length / (1024 * 1024);
  } catch {
    return 0;
  }
};

export const computeUsageMetrics = ({
  resources = [],
  notes = [],
  papers = [],
  cloudUsage = {}
} = {}) => {
  const safeResources = normalizeArray(resources);
  const safeNotes = normalizeArray(notes);
  const safePapers = normalizeArray(papers);

  const explicitResourcesMB = safeResources.reduce((acc, item) => acc + parseMB(item?.size), 0);
  const estimatedLocalMB = Number(
    (
      explicitResourcesMB +
      estimateCollectionSizeMB(safeResources) +
      estimateCollectionSizeMB(safeNotes) +
      estimateCollectionSizeMB(safePapers)
    ).toFixed(3)
  );

  const localFileCount =
    countValidItems(safeResources) + countValidItems(safeNotes) + countValidItems(safePapers);

  const cloudFileCount = Number(cloudUsage?.fileCount || 0);
  const cloudStorageUsedMB = Number(cloudUsage?.storageUsedMB || 0);

  return {
    localFileCount,
    localStorageUsedMB: estimatedLocalMB,
    displayFileCount: Math.max(cloudFileCount, localFileCount),
    displayStorageUsedMB: Math.max(cloudStorageUsedMB, estimatedLocalMB)
  };
};

export { ASSET_KEYS, parseMB };
