export const courseCompletedNotification = (courseTitle) => ({
  title: 'Course Completed',
  message: `"${courseTitle}" marked as completed`,
  type: 'course',
  route: '/courses'
});

export const videoCompletedNotification = (videoTitle, reason = 'completed') => ({
  title: 'Video Completed',
  message: reason === 'reached'
    ? `"${videoTitle}" reached completion`
    : `"${videoTitle}" marked as completed`,
  type: 'video',
  route: '/videos'
});

export const chatMessageNotification = (roomTitle, senderName, messagePreview, roomId = '') => ({
  title: `New message in ${roomTitle || 'Chat'}`,
  message: `${senderName || 'Someone'}: ${String(messagePreview || 'Sent a new message').slice(0, 120)}`,
  type: 'chat',
  route: roomId ? `/chat?room=${encodeURIComponent(roomId)}` : '/chat'
});

export const chatMentionNotification = (roomTitle, senderName, messagePreview, roomId = '') => ({
  title: `Mention in ${roomTitle || 'Chat'}`,
  message: `${senderName || 'Someone'} mentioned you: ${String(messagePreview || 'Open the room').slice(0, 120)}`,
  type: 'chat-mention',
  route: roomId ? `/chat?room=${encodeURIComponent(roomId)}` : '/chat'
});

export const chatSharedContentNotification = (roomTitle, senderName, messagePreview, roomId = '') => ({
  title: `Shared content in ${roomTitle || 'Chat'}`,
  message: `${senderName || 'Someone'} shared content: ${String(messagePreview || 'Open the room').slice(0, 120)}`,
  type: 'chat-share',
  route: roomId ? `/chat?room=${encodeURIComponent(roomId)}` : '/chat'
});
