const YOUTUBE_API_KEY = 'AIzaSyA8b-Uo_PoXYN53f65ap34F3F8yedqPHyk';

export async function fetchYouTubeRelatedVideos(videoId, title) {
  if (!videoId && !title) return [];
  try {
    let query = title || 'CS50 Artificial Intelligence';
    query = query.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 50);

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
    if (!res.ok) {
      console.warn('YouTube Related API returned status:', res.status);
      return [];
    }
    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) return [];

    return data.items
      .filter(item => item.id?.videoId && item.id.videoId !== videoId)
      .map(item => ({
        id: item.id.videoId,
        title: item.snippet?.title || 'YouTube Video',
        channelTitle: item.snippet?.channelTitle || 'YouTube Channel',
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        category: item.snippet?.channelTitle || 'YouTube'
      })).slice(0, 4);
  } catch (err) {
    console.error('Error fetching YouTube related videos:', err);
    return [];
  }
}
