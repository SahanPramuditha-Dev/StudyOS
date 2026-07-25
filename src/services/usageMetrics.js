import { STORAGE_KEYS } from './storage.js';
import { validateStorageSize, formatStorage, calculateStorageFromAssets } from './storageService.js';

const ASSET_KEYS = [STORAGE_KEYS.RESOURCES, STORAGE_KEYS.NOTES, STORAGE_KEYS.PAPERS];

const parseMB = (sizeValue) => {
  const bytes = validateStorageSize(sizeValue);
  return bytes / (1024 * 1024);
};

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const countValidItems = (items) => items.filter((item) => item && (item.id || item.uid)).length;

export const computeUsageMetrics = ({
  resources = [],
  notes = [],
  papers = [],
  cloudUsage = {}
} = {}) => {
  const safeResources = normalizeArray(resources);
  const safeNotes = normalizeArray(notes);
  const safePapers = normalizeArray(papers);

  const calculated = calculateStorageFromAssets({
    resources: safeResources,
    notes: safeNotes,
    papers: safePapers,
    cloudStorage: cloudUsage
  });

  const localFileCount =
    countValidItems(safeResources) + countValidItems(safeNotes) + countValidItems(safePapers);

  const cloudFileCount = Number(cloudUsage?.fileCount || cloudUsage?.assetCount || 0);

  const totalBytes = calculated.totalBytes;
  const displayStorageUsedMB = Number((totalBytes / (1024 * 1024)).toFixed(3));

  return {
    totalBytes,
    formattedSize: calculated.formattedSize,
    localFileCount,
    localStorageUsedMB: displayStorageUsedMB,
    displayFileCount: Math.max(cloudFileCount, localFileCount),
    displayStorageUsedMB,
    breakdown: calculated.breakdown
  };
};

export { ASSET_KEYS, parseMB };

