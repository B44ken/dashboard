import useSWR from 'swr';
import { FaSpotify, FaPause, FaPlay } from 'react-icons/fa';
import Image from 'next/image';

interface SpotifyPayload {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImage?: string;
  progressMs?: number;
  durationMs?: number;
  externalUrl?: string;
  error?: string;
  message?: string;
  requiresAuth?: boolean;
  authUrl?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatMs(ms?: number) {
  if (!ms && ms !== 0) return '--:--';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function SpotifyWidget() {
  const { data, error, isLoading } = useSWR<SpotifyPayload>('/api/spotify', fetcher, {
    refreshInterval: 15000
  });

  const isError = !!error || data?.error;
  const isPlaying = data?.isPlaying;
  const progress = data?.progressMs && data?.durationMs
    ? Math.min(100, Math.round((data.progressMs / data.durationMs) * 100))
    : 0;

  const needsAuth = data?.requiresAuth;

  return (
    <div className="widget-card">
      <div className="widget-title">
        <FaSpotify className="text-green-400" />
        <span>Spotify</span>
      </div>

      <div className="flex gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400/20 to-blue-400/10 border border-white/5">
          {data?.albumImage && (
            <Image src={data.albumImage} alt={data.album ?? 'Album art'} fill className="object-cover" />
          )}
        </div>

        <div className="flex-1">
          {needsAuth && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-white">Sign in to Spotify</div>
              <div className="text-xs text-muted">Connect to show what’s playing.</div>
              <a
                href={data?.authUrl ?? 'https://accounts.spotify.com/en/login'}
                className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-3 py-2 text-sm font-semibold text-black hover:bg-green-400"
              >
                Open login
              </a>
            </div>
          )}

          {isError && !needsAuth && (
            <div className="text-sm text-red-300">{data?.message ?? 'Unable to reach Spotify right now.'}</div>
          )}

          {!isError && !needsAuth && (
            <>
              <div className="text-xs uppercase tracking-[0.2em] text-muted mb-1">
                {isLoading ? 'Loading' : isPlaying ? 'Playing' : 'Paused'}
              </div>
              <div className="text-lg font-semibold leading-snug">
                {data?.title ?? '—'}
              </div>
              <div className="text-sm text-muted">{data?.artist ?? '—'}</div>
              <div className="text-xs text-muted mt-1">{data?.album ?? '—'}</div>
            </>
          )}

          <div className="mt-4 space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${isPlaying ? 'bg-green-400' : 'bg-white/30'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>{formatMs(data?.progressMs)}</span>
              <span>{formatMs(data?.durationMs)}</span>
            </div>
          </div>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white border border-white/5">
          {isPlaying ? <FaPause /> : <FaPlay className="translate-x-[1px]" />}
        </div>
      </div>

      {data?.externalUrl && (
        <a
          href={data.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center text-sm text-green-300 hover:text-green-100"
        >
          Open in Spotify
        </a>
      )}
    </div>
  );
}
