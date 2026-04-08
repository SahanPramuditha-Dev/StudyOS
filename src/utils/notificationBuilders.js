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
