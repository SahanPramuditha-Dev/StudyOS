import { uploadFile } from './firebaseStorage';

const CHAT_ATTACHMENT_EXTENSIONS = [
  'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg',
  'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
  'txt', 'md', 'csv', 'zip', 'mp4', 'mov', 'mp3', 'wav', 'ogg'
];

export const getChatAttachmentLimitBytes = (plan = 'Free', role = 'restricted') => {
  const normalizedRole = String(role || 'restricted').toLowerCase();
  const normalizedPlan = String(plan || 'Free').toLowerCase();

  if (normalizedRole === 'admin' || normalizedRole === 'superadmin') return 50 * 1024 * 1024;
  if (normalizedPlan === 'pro') return 25 * 1024 * 1024;
  return 10 * 1024 * 1024;
};

const getSafeFileName = (fileName = 'attachment') => {
  const base = String(fileName || 'attachment').replace(/\.[^/.]+$/, '');
  return base.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'attachment';
};

export const isValidChatAttachmentFile = (file) => {
  if (!file) return false;
  const ext = String(file.name || '').split('.').pop().toLowerCase();
  return CHAT_ATTACHMENT_EXTENSIONS.includes(ext) || Boolean(file.type);
};

const compressImageFile = (file, maxWidth = 1600, quality = 0.82) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
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
          if (!blob) {
            resolve(file);
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
};

export const uploadChatAttachment = async ({ file, userId, roomId }) => {
  if (!file) throw new Error('No file selected');
  if (!userId) throw new Error('Not authenticated');
  if (!roomId) throw new Error('Missing room');
  if (!isValidChatAttachmentFile(file)) {
    throw new Error('This file type is not supported for chat attachments.');
  }

  const processedFile = await compressImageFile(file);
  const safeName = getSafeFileName(processedFile.name);
  const extension = String(processedFile.name || '').split('.').pop().toLowerCase() || 'bin';
  const storagePath = `users/${userId}/chatAttachments/${roomId}/${Date.now()}_${safeName}.${extension}`;
  const downloadURL = await uploadFile(processedFile, storagePath);

  return {
    downloadURL,
    storagePath,
    fileName: processedFile.name,
    mimeType: processedFile.type || 'application/octet-stream',
    size: processedFile.size || 0
  };
};

export const uploadRoomAvatar = async ({ file, userId, roomId }) => {
  if (!file) throw new Error('No image selected');
  if (!userId || !roomId) throw new Error('Missing authentication or room ID');
  const compressed = await compressImageFile(file, 500, 0.85);
  const storagePath = `users/${userId}/roomAvatars/${roomId}/${Date.now()}.jpg`;
  const downloadURL = await uploadFile(compressed, storagePath);
  return downloadURL;
};
