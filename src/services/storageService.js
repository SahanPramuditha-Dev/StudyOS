import { STORAGE_KEYS, StorageService } from './storage.js';

/**
 * Validates and sanitizes a storage size value into a safe non-negative integer (raw bytes).
 * Handles null, undefined, NaN, Infinity, string numbers, formatted string units, and negative numbers.
 * @param {any} size 
 * @returns {number} Non-negative integer in bytes
 */
export const validateStorageSize = (size) => {
  if (size === null || size === undefined) return 0;

  if (typeof size === 'number') {
    if (Number.isNaN(size) || !Number.isFinite(size) || size < 0) return 0;
    return Math.floor(size);
  }

  if (typeof size === 'string') {
    const trimmed = size.trim();
    if (!trimmed) return 0;

    // Check pure numeric string
    if (/^\d+$/.test(trimmed)) {
      const parsed = parseInt(trimmed, 10);
      return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
    }

    // Check string formatted with units (e.g. "1.5 MB", "500 KB", "2 GB", "1024 Bytes")
    const match = trimmed.match(/^([\d.]+)\s*(bytes|b|kb|mb|gb|tb)?$/i);
    if (match) {
      const num = parseFloat(match[1]);
      if (Number.isNaN(num) || num < 0) return 0;

      const unit = (match[2] || 'b').toLowerCase();
      let multiplier = 1;
      if (unit === 'kb') multiplier = 1024;
      else if (unit === 'mb') multiplier = 1024 * 1024;
      else if (unit === 'gb') multiplier = 1024 * 1024 * 1024;
      else if (unit === 'tb') multiplier = 1024 * 1024 * 1024 * 1024;

      return Math.floor(num * multiplier);
    }
  }

  return 0;
};

/**
 * Formats a raw byte count into a human-readable storage string.
 * @param {number|any} bytes Raw byte count
 * @returns {string} E.g., "0 Bytes", "1 KB", "1.22 MB", "1.2 GB"
 */
export const formatStorage = (bytes) => {
  const safeBytes = validateStorageSize(bytes);
  if (safeBytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(safeBytes) / Math.log(k)));

  if (i === 0) return `${safeBytes} Bytes`;

  const val = safeBytes / Math.pow(k, i);
  const formattedVal = parseFloat(val.toFixed(2));
  return `${formattedVal} ${sizes[i]}`;
};

/**
 * Extract inline base64 asset sizes in bytes from text content
 */
export const extractBase64BytesFromContent = (contentString) => {
  let bytes = 0;
  let count = 0;
  if (typeof contentString !== 'string') return { bytes: 0, count: 0 };
  
  const regex = /data:(image\/[^;]+|application\/pdf);base64,([^"'\s\)\>]+)/g;
  let match;
  while ((match = regex.exec(contentString)) !== null) {
    if (match[2]) {
      const base64Len = match[2].length;
      const assetBytes = Math.floor(base64Len * (3 / 4));
      bytes += validateStorageSize(assetBytes);
      count += 1;
    }
  }
  return { bytes, count };
};

/**
 * Ensures an asset metadata object complies with standard storage tracking schema.
 * @param {Object} asset 
 * @returns {Object} Standardized asset metadata object
 */
export const normalizeAssetMetadata = (asset = {}, userId = '') => {
  const rawSize = asset.sizeBytes ?? asset.fileSize ?? asset.size ?? 0;
  const sizeBytes = validateStorageSize(rawSize);

  return {
    id: asset.id || asset.uid || `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: asset.name || asset.title || asset.filename || 'Untitled Asset',
    path: asset.path || asset.fileUrl || asset.url || '',
    type: asset.type || asset.mimeType || 'file',
    sizeBytes,
    createdAt: asset.createdAt || asset.timestamp || new Date().toISOString(),
    uploadedBy: asset.uploadedBy || userId || ''
  };
};

/**
 * Calculates total storage breakdown from local or user collections.
 * @param {Object} params
 * @param {Array} params.resources
 * @param {Array} params.notes
 * @param {Array} params.papers
 * @param {Object} params.alarm
 * @param {Object} params.cloudStorage
 * @returns {Object} Standard storage calculation object
 */
export const calculateStorageFromAssets = ({
  resources = [],
  notes = [],
  papers = [],
  alarm = null,
  cloudStorage = null
} = {}) => {
  let docBytes = 0;
  let noteBytes = 0;
  let audioBytes = 0;
  let totalAssets = 0;

  const safeResources = Array.isArray(resources) ? resources : [];
  const safeNotes = Array.isArray(notes) ? notes : [];
  const safePapers = Array.isArray(papers) ? papers : [];

  // Calculate Resources & Papers (Documents)
  safeResources.forEach((item) => {
    if (!item) return;
    totalAssets += 1;
    const explicitBytes = validateStorageSize(item.sizeBytes ?? item.fileSize ?? item.size);
    if (explicitBytes > 0) {
      docBytes += explicitBytes;
    } else if (item.content) {
      const extracted = extractBase64BytesFromContent(item.content);
      docBytes += extracted.bytes;
    }
  });

  safePapers.forEach((item) => {
    if (!item) return;
    totalAssets += 1;
    const explicitBytes = validateStorageSize(item.sizeBytes ?? item.fileSize ?? item.size);
    if (explicitBytes > 0) {
      docBytes += explicitBytes;
    } else if (item.content) {
      const extracted = extractBase64BytesFromContent(item.content);
      docBytes += extracted.bytes;
    }
  });

  // Calculate Notes
  safeNotes.forEach((item) => {
    if (!item) return;
    totalAssets += 1;
    const explicitBytes = validateStorageSize(item.sizeBytes ?? item.fileSize ?? item.size);
    if (explicitBytes > 0) {
      noteBytes += explicitBytes;
    } else if (item.content) {
      const extracted = extractBase64BytesFromContent(item.content);
      noteBytes += extracted.bytes;
    }
  });

  // Calculate Alarm Audio
  if (alarm && alarm.enabled && (alarm.soundPath || alarm.soundUrl || alarm.sizeBytes || alarm.fileSize)) {
    const audioSize = validateStorageSize(alarm.sizeBytes ?? alarm.fileSize ?? alarm.size);
    if (audioSize > 0) {
      audioBytes += audioSize;
      totalAssets += 1;
    }
  }

  let totalBytes = docBytes + noteBytes + audioBytes;
  let assetCount = totalAssets;

  // Cloud usage integration if available and larger
  if (cloudStorage && typeof cloudStorage === 'object') {
    const cloudBytes = validateStorageSize(cloudStorage.totalBytes ?? (cloudStorage.storageUsedMB ? cloudStorage.storageUsedMB * 1024 * 1024 : 0));
    const cloudCount = validateStorageSize(cloudStorage.assetCount ?? cloudStorage.fileCount);
    totalBytes = Math.max(totalBytes, cloudBytes);
    assetCount = Math.max(assetCount, cloudCount);
  }

  return {
    totalBytes,
    formattedSize: formatStorage(totalBytes),
    assetCount,
    breakdown: {
      documents: docBytes,
      notes: noteBytes,
      audio: audioBytes
    }
  };
};

/**
 * Central Service class for storage operations
 */
export class CentralStorageService {
  /**
   * Retrieves and calculates storage usage for a given user ID from local state / StorageService
   * @param {string} userId 
   * @returns {Object} Standard storage calculation object
   */
  static getUserStorageUsage(userId = '') {
    try {
      const resources = StorageService.get(STORAGE_KEYS.RESOURCES) || [];
      const notes = StorageService.get(STORAGE_KEYS.NOTES) || [];
      const papers = StorageService.get(STORAGE_KEYS.PAPERS) || [];
      const notifSettings = StorageService.get(STORAGE_KEYS.NOTIF_SETTINGS) || {};
      const alarm = notifSettings.alarm || null;

      return calculateStorageFromAssets({
        resources,
        notes,
        papers,
        alarm
      });
    } catch (error) {
      console.error('[CentralStorageService] Error calculating storage usage:', error);
      return {
        totalBytes: 0,
        formattedSize: '0 Bytes',
        assetCount: 0,
        breakdown: { documents: 0, notes: 0, audio: 0 }
      };
    }
  }

  /**
   * Gets storage breakdown for user
   */
  static getStorageBreakdown(userId = '') {
    const usage = this.getUserStorageUsage(userId);
    return usage.breakdown;
  }
}

export default CentralStorageService;
