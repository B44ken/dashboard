import Image from 'next/image';
import { useEffect, useState } from 'react';

interface SpotifyTrack {
  title: string;
  artist: string;
  album: string;
  url: string;
  cover: string;
}

interface SpotifyResponse {
  isPlaying: boolean;
  track?: SpotifyTrack;
  error?: string;
}

export function SpotifyWidget() {
  const [data, setData] = useState<SpotifyResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch('/api/spotify/now-playing');
        const payload = (await response.json()) as SpotifyResponse;
        if (!cancelled) {
          setData(payload);
        }
      } catch (error) {
        console.error('Spotify widget', error);
      }
    };

    load();
    const interval = setInterval(load, 45_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const isConfigured = data ? !data.error : true;
  const isPlaying = data?.isPlaying && data.track;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Spotify</p>
          <h2 className="text-2xl font-bold">Now Playing</h2>
          <p className="text-sm text-neutral-400">Pulls from your account via refresh token.</p>
        </div>
        <div className="text-right text-xs text-neutral-500">Refreshes every 45s</div>
      </div>

      {!isConfigured && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          Add <code>SPOTIFY_CLIENT_ID</code>, <code>SPOTIFY_CLIENT_SECRET</code>, and
          <code> SPOTIFY_REFRESH_TOKEN</code> to enable this widget.
        </div>
      )}

      {isPlaying ? (
        <div className="mt-4 flex items-center gap-4">
          {data.track?.cover ? (
            <Image
              src={data.track.cover}
              alt={data.track.title}
              width={96}
              height={96}
              className="h-24 w-24 rounded-lg object-cover shadow"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-neutral-800 text-neutral-500">
              ♫
            </div>
          )}
          <div className="space-y-1">
            <div className="text-lg font-semibold leading-tight">{data.track?.title}</div>
            <div className="text-sm text-neutral-300">{data.track?.artist}</div>
            <div className="text-sm text-neutral-500">{data.track?.album}</div>
            <a
              href={data.track?.url}
              className="inline-flex items-center text-sm font-medium text-emerald-300 hover:text-emerald-200"
              target="_blank"
              rel="noreferrer"
            >
              Open in Spotify
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-neutral-300">
          <div>
            <div className="text-neutral-100">Nothing playing</div>
            <div className="text-neutral-500">Start a track to see album art and artist details.</div>
          </div>
          <span className="text-2xl">⏸</span>
        </div>
      )}
    </div>
  );
}
