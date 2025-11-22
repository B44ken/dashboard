import type { NextApiRequest, NextApiResponse } from 'next';
import { getNowPlaying } from '../../lib/spotify';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const nowPlaying = await getNowPlaying();
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    res.status(200).json(nowPlaying);
  } catch (error) {
    const err = error as Error & { requiresAuth?: boolean };
    const status = err.requiresAuth ? 401 : 500;

    res
      .status(status)
      .json({
        error: 'Unable to load Spotify data',
        message: err.message,
        requiresAuth: !!err.requiresAuth,
        authUrl: 'https://accounts.spotify.com/en/login'
      });
  }
}
