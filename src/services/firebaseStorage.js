import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import app from './firebase';

const storage = getStorage(app);

/**
 * Compress images on client side before upload to save bandwidth & storage
 */
const compressImageIfNeeded = async (file, maxWidth = 1920, quality = 0.8) => {
  if (!file || !file.type.startsWith('image/') || file.type.includes('svg') || file.size < 500 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

/**
 * Upload a file to Firebase Storage (with auto image compression)
 * @param {File} file - The file to upload
 * @param {string} path - The storage path (e.g., 'users/{userId}/files/{fileId}')
 * @returns {Promise<string>} - The download URL
 */
export const uploadFile = async (file, path) => {
  try {
    const fileToUpload = await compressImageIfNeeded(file);
    const storageRef = ref(storage, path);
    const metadata = {
      cacheControl: 'public, max-age=31536000',
    };
    const snapshot = await uploadBytes(storageRef, fileToUpload, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 * @param {string} path - The storage path
 */
export const deleteFile = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get download URL for a file
 * @param {string} path - The storage path
 * @returns {Promise<string>} - The download URL
 */
export const getFileURL = async (path) => {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};

/**
 * List all files in a directory
 * @param {string} path - The directory path
 * @returns {Promise<Array>} - Array of file references
 */
export const listFiles = async (path) => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    return result.items;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

/**
 * Generate a unique file path for user uploads
 * @param {string} userId - The user ID
 * @param {string} projectId - The project ID (optional)
 * @param {string} fileName - The original file name
 * @returns {string} - The storage path
 */
export const generateFilePath = (userId, projectId, fileName) => {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const safeName = baseName.replace(/[^a-zA-Z0-9]/g, '_');

  if (projectId) {
    return `users/${userId}/projects/${projectId}/${timestamp}_${safeName}.${extension}`;
  } else {
    return `users/${userId}/files/${timestamp}_${safeName}.${extension}`;
  }
};