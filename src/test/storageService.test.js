import { describe, it, expect } from 'vitest';
import { validateStorageSize, formatStorage, calculateStorageFromAssets } from '../services/storageService';

describe('Storage Utility & Validation Tests', () => {
  describe('validateStorageSize', () => {
    it('handles zero, null, and undefined safely', () => {
      expect(validateStorageSize(0)).toBe(0);
      expect(validateStorageSize(null)).toBe(0);
      expect(validateStorageSize(undefined)).toBe(0);
    });

    it('handles negative, NaN, and Infinity numbers', () => {
      expect(validateStorageSize(-500)).toBe(0);
      expect(validateStorageSize(NaN)).toBe(0);
      expect(validateStorageSize(Infinity)).toBe(0);
      expect(validateStorageSize(-Infinity)).toBe(0);
    });

    it('handles raw byte numbers correctly', () => {
      expect(validateStorageSize(1024)).toBe(1024);
      expect(validateStorageSize(1048576)).toBe(1048576);
      expect(validateStorageSize(1225324.455)).toBe(1225324);
    });

    it('parses numeric and unit-formatted strings correctly', () => {
      expect(validateStorageSize('1024')).toBe(1024);
      expect(validateStorageSize('1 KB')).toBe(1024);
      expect(validateStorageSize('1 MB')).toBe(1048576);
      expect(validateStorageSize('1.5 MB')).toBe(1572864);
      expect(validateStorageSize('1 GB')).toBe(1073741824);
    });
  });

  describe('formatStorage', () => {
    it('formats 0 bytes as "0 Bytes"', () => {
      expect(formatStorage(0)).toBe('0 Bytes');
      expect(formatStorage(null)).toBe('0 Bytes');
      expect(formatStorage(undefined)).toBe('0 Bytes');
    });

    it('formats small byte values correctly', () => {
      expect(formatStorage(500)).toBe('500 Bytes');
      expect(formatStorage(1024)).toBe('1 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatStorage(1048576)).toBe('1 MB');
      expect(formatStorage(524288000)).toBe('500 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatStorage(1073741824)).toBe('1 GB');
      expect(formatStorage(1309965025)).toBe('1.22 GB');
    });
  });

  describe('calculateStorageFromAssets', () => {
    it('calculates total bytes and breakdown from resources and notes', () => {
      const resources = [
        { id: '1', sizeBytes: 1048576 }, // 1 MB
        { id: '2', size: '2 MB' } // 2 MB
      ];
      const notes = [
        { id: 'n1', sizeBytes: 524288 } // 0.5 MB
      ];

      const result = calculateStorageFromAssets({ resources, notes });
      expect(result.totalBytes).toBe(3670016); // 3.5 MB
      expect(result.formattedSize).toBe('3.5 MB');
      expect(result.assetCount).toBe(3);
      expect(result.breakdown.documents).toBe(3145728);
      expect(result.breakdown.notes).toBe(524288);
    });
  });
});
