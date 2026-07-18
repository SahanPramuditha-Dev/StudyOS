const PROXIES = [
  {
    url: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    isJson: false
  },
  {
    url: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    isJson: true
  },
  {
    url: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    isJson: false
  },
  {
    url: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    isJson: false
  }
];

async function fetchWithFallback(targetUrl) {
  let lastError;
  for (const proxy of PROXIES) {
    try {
      const proxyUrl = proxy.url(targetUrl);
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml' }
      });
      if (!response.ok) {
        throw new Error(`Proxy responded with status: ${response.status}`);
      }
      
      if (proxy.isJson) {
        const data = await response.json();
        if (data.contents && data.contents.length > 0) return data.contents;
      } else {
        const text = await response.text();
        if (text && text.length > 0) return text;
      }
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`All CORS proxies failed to fetch the URL: ${lastError?.message}`);
}

export async function fetchTranscript(videoId) {
  try {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const html = await fetchWithFallback(youtubeUrl);
    
    // Extract the captions JSON from the page source
    const captionsMatch = html.match(/"captions":({.*?})[,}]/);
    if (!captionsMatch) {
      throw new Error('Transcripts are disabled or not available for this video.');
    }
    
    try {
      const tracklistMatch = html.match(/"captionTracks":(\[.*?\])/);
      if (tracklistMatch) {
        const tracks = JSON.parse(tracklistMatch[1]);
        
        if (!tracks || tracks.length === 0) {
          throw new Error('No transcript tracks found.');
        }

        // Prefer English track
        let track = tracks.find(t => t.languageCode.startsWith('en'));
        if (!track) track = tracks[0]; // fallback to first available

        const transcriptUrl = track.baseUrl;
        
        // Fetch the XML transcript using the proxy fallback as well
        const xml = await fetchWithFallback(transcriptUrl);
        
        // Parse the XML
        const transcript = [];
        const textRegex = /<text start="([^"]+)" dur="([^"]+)".*?>(.*?)<\/text>/g;
        let match;
        
        while ((match = textRegex.exec(xml)) !== null) {
          const start = parseFloat(match[1]);
          const duration = parseFloat(match[2]);
          
          // Decode HTML entities
          let text = match[3]
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;#39;/g, "'"); 
            
          // Remove any embedded XML tags (like <font>)
          text = text.replace(/(<([^>]+)>)/gi, "");
            
          transcript.push({
            start,
            duration,
            text
          });
        }
        
        if (transcript.length === 0) throw new Error('Could not parse XML track');
        return transcript;
      }
    } catch (e) {}

    // 2. Try an alternative transcript API (youtubetranscript.com)
    try {
      const altRes = await fetch(`https://youtubetranscript.com/?server_vid2=${videoId}`);
      const xmlAlt = await altRes.text();
      if (xmlAlt && xmlAlt.includes('<text')) {
        const transcript = [];
        const textRegex = /<text start="([^"]+)" dur="([^"]+)".*?>(.*?)<\/text>/g;
        let match;
        while ((match = textRegex.exec(xmlAlt)) !== null) {
          transcript.push({
            start: parseFloat(match[1]),
            duration: parseFloat(match[2]),
            text: match[3].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/(<([^>]+)>)/gi, "")
          });
        }
        if (transcript.length > 0) return transcript;
      }
    } catch (e) {}

    throw new Error('Transcripts disabled or proxy blocked.');
  } catch (error) {
    console.warn("Transcript fetching failed:", error);
    throw error;
  }
}
