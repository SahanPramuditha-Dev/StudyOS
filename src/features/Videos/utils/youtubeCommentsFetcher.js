const YOUTUBE_API_KEY = 'AIzaSyA8b-Uo_PoXYN53f65ap34F3F8yedqPHyk';

export async function fetchYouTubeComments(videoId) {
  if (!videoId) return [];
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&maxResults=30&order=relevance&videoId=${videoId}&key=${YOUTUBE_API_KEY}`);
    if (!res.ok) {
      console.warn('YouTube Comment API returned status:', res.status);
      return [];
    }
    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) return [];

    return data.items.map(item => {
      const snippet = item.snippet?.topLevelComment?.snippet;
      return {
        id: item.id || Math.random().toString(),
        author: snippet?.authorDisplayName || 'YouTube Viewer',
        avatar: snippet?.authorProfileImageUrl || null,
        time: snippet?.publishedAt ? formatCommentTime(snippet.publishedAt) : 'Recently',
        text: snippet?.textOriginal || snippet?.textDisplay || '',
        likes: snippet?.likeCount || 0,
        replies: item.snippet?.totalReplyCount || 0
      };
    });
  } catch (err) {
    console.error('Error fetching YouTube comments:', err);
    return [];
  }
}

function formatCommentTime(publishedAt) {
  try {
    const diffMs = Date.now() - new Date(publishedAt).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffYear > 0) return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
    if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
    if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffMin > 0) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    return 'Just now';
  } catch {
    return 'Recently';
  }
}
