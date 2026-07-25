const YOUTUBE_API_KEY = 'AIzaSyA8b-Uo_PoXYN53f65ap34F3F8yedqPHyk';

export async function fetchYouTubeChapters(videoId) {
  if (!videoId) return [];
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`);
    if (!res.ok) return [];
    const data = await res.json();
    const description = data.items?.[0]?.snippet?.description;
    if (!description) return [];

    return parseChaptersFromText(description);
  } catch (err) {
    console.error('Error fetching YouTube chapters:', err);
    return [];
  }
}

export function parseChaptersFromText(text) {
  if (!text) return [];
  const chapters = [];
  const regex = /(?:(\d{1,2}):)?(\d{2}):(\d{2})\s*[-–—:]?\s*(.+)/g;
  let match;
  let idx = 1;

  while ((match = regex.exec(text)) !== null) {
    const hrs = match[1] ? parseInt(match[1], 10) : 0;
    const mins = parseInt(match[2], 10);
    const secs = parseInt(match[3], 10);
    const rawTitle = match[4].trim().replace(/^[*#_-\s]+|[*#_-\s]+$/g, '');
    const startSec = hrs * 3600 + mins * 60 + secs;

    const formattedRange = hrs > 0 
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (rawTitle && rawTitle.length > 2 && !rawTitle.toLowerCase().includes('http')) {
      chapters.push({
        id: idx,
        num: idx,
        title: `${idx}. ${rawTitle}`,
        startSec,
        range: formattedRange
      });
      idx++;
    }
  }
  return chapters;
}
