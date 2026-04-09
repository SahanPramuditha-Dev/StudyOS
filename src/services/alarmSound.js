import { uploadFile } from './firebaseStorage';

const ALARM_SOUND_EXTENSIONS = ['mp3', 'wav', 'ogg'];

export const getAlarmSoundLimitBytes = (plan = 'Free', role = 'restricted') => {
  const normalizedRole = String(role || 'restricted').toLowerCase();
  const normalizedPlan = String(plan || 'Free').toLowerCase();

  if (normalizedRole === 'admin' || normalizedRole === 'superadmin') return 20 * 1024 * 1024;
  if (normalizedPlan === 'pro') return 10 * 1024 * 1024;
  return 2 * 1024 * 1024;
};

const getSafeFileName = (fileName = 'alarm') => {
  const base = String(fileName || 'alarm').replace(/\.[^/.]+$/, '');
  return base.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'alarm';
};

export const isValidAlarmSoundFile = (file) => {
  if (!file) return false;
  const mimeOk = typeof file.type === 'string' && file.type.startsWith('audio/');
  const ext = String(file.name || '').split('.').pop().toLowerCase();
  return mimeOk || ALARM_SOUND_EXTENSIONS.includes(ext);
};

export const uploadAlarmSound = async ({ file, userId, scope = 'alarm' }) => {
  if (!file) throw new Error('No audio file provided');
  if (!userId) throw new Error('Not authenticated');
  if (!isValidAlarmSoundFile(file)) {
    throw new Error('Please upload an MP3, WAV, or OGG audio file.');
  }

  const safeName = getSafeFileName(file.name);
  const extension = String(file.name || '').split('.').pop().toLowerCase() || 'mp3';
  const storagePath = `users/${userId}/alarmSounds/${scope}/${Date.now()}_${safeName}.${extension}`;
  const downloadURL = await uploadFile(file, storagePath);

  return {
    downloadURL,
    storagePath,
    fileName: file.name,
    mimeType: file.type || `audio/${extension}`,
    size: file.size || 0
  };
};
