const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

const BASIC = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

export interface NowPlayingInfo {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImage?: string;
  progressMs?: number;
  durationMs?: number;
  externalUrl?: string;
}

async function getAccessToken() {
  if (!clientId || !clientSecret || !refreshToken) {
    const error: Error & { requiresAuth?: boolean } = new Error('Missing Spotify credentials');
    error.requiresAuth = true;
    throw error;
  }

  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${BASIC}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh Spotify token');
  }

  return tokenResponse.json() as Promise<{ access_token: string }>;
}

export async function getNowPlaying(): Promise<NowPlayingInfo> {
  const { access_token } = await getAccessToken();
  const response = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });

  if (response.status === 204 || response.status > 400) {
    return { isPlaying: false };
  }

  const song = await response.json();
  const item = song.item;

  return {
    isPlaying: song.is_playing,
    title: item?.name,
    artist: item?.artists?.map((artist: { name: string }) => artist.name).join(', '),
    album: item?.album?.name,
    albumImage: item?.album?.images?.[0]?.url,
    progressMs: song.progress_ms,
    durationMs: item?.duration_ms,
    externalUrl: item?.external_urls?.spotify
  };
}
