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

export const uploadChatAttachment = async ({ file, userId, roomId }) => {
  if (!file) throw new Error('No file selected');
  if (!userId) throw new Error('Not authenticated');
  if (!roomId) throw new Error('Missing room');
  if (!isValidChatAttachmentFile(file)) {
    throw new Error('This file type is not supported for chat attachments.');
  }

  const safeName = getSafeFileName(file.name);
  const extension = String(file.name || '').split('.').pop().toLowerCase() || 'bin';
  const storagePath = `users/${userId}/chatAttachments/${roomId}/${Date.now()}_${safeName}.${extension}`;
  const downloadURL = await uploadFile(file, storagePath);

  return {
    downloadURL,
    storagePath,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size || 0
  };
};
