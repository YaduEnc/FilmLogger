// Vercel Serverless Function to convert images to base64
// Fetches images server-side to avoid CORS issues

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.method === 'GET' ? req.query : req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate URL
    let imageUrl;
    try {
      imageUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Only allow TMDB images for security
    if (!imageUrl.hostname.includes('tmdb.org') && !imageUrl.hostname.includes('themoviedb.org')) {
      return res.status(403).json({ error: 'Only TMDB images are allowed' });
    }

    // Fetch image server-side (no CORS issues)
    const imageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FilmLogger/1.0)',
      },
    });

    if (!imageResponse.ok) {
      return res.status(imageResponse.status).json({ 
        error: `Failed to fetch image: ${imageResponse.statusText}` 
      });
    }

    // Get image as buffer
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine content type
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Convert to base64
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    return res.status(200).json({ 
      base64: dataUrl,
      contentType,
      size: buffer.length 
    });

  } catch (error) {
    console.error('Error converting image to base64:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
