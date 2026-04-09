import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import app from './firebase';

const storage = getStorage(app);

/**
 * Upload a file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} path - The storage path (e.g., 'users/{userId}/files/{fileId}')
 * @returns {Promise<string>} - The download URL
 */
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
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