import type { NextApiRequest, NextApiResponse } from 'next';

interface NowPlayingResponse {
  isPlaying: boolean;
  track?: {
    title: string;
    artist: string;
    album: string;
    url: string;
    cover: string;
  };
  error?: string;
}

async function getAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<NowPlayingResponse>,
) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    res.status(200).json({
      isPlaying: false,
      error: 'Spotify environment variables are not configured.',
    });
    return;
  }

  const nowPlaying = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (nowPlaying.status === 204 || nowPlaying.status === 202) {
    res.status(200).json({ isPlaying: false });
    return;
  }

  if (!nowPlaying.ok) {
    res.status(200).json({ isPlaying: false });
    return;
  }

  const track = (await nowPlaying.json()) as {
    item?: {
      name: string;
      external_urls?: { spotify?: string };
      album?: { name?: string; images?: Array<{ url: string }> };
      artists?: Array<{ name: string }>;
    };
    is_playing?: boolean;
  };

  if (!track.item) {
    res.status(200).json({ isPlaying: false });
    return;
  }

  res.status(200).json({
    isPlaying: Boolean(track.is_playing),
    track: {
      title: track.item.name,
      artist: track.item.artists?.map((artist) => artist.name).join(', ') ?? 'Unknown artist',
      album: track.item.album?.name ?? 'Unknown album',
      url: track.item.external_urls?.spotify ?? '#',
      cover: track.item.album?.images?.[0]?.url ?? '',
    },
  });
}
