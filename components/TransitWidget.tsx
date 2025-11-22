import { useEffect, useMemo, useState } from 'react';

interface TransitApiResponse {
  updatedAt: string;
  results: Record<string, { times: string[]; error?: string }>;
}

interface TransitStop {
  id: string;
  direction: string;
  routeLabel: string;
  accent: 'route' | 'subway';
}

const subwayStops: TransitStop[] = [
  {
    id: 'subway-south',
    direction: 'UNION',
    routeLabel: '1',
    accent: 'subway',
  },
  {
    id: 'subway-north',
    direction: 'FINCH',
    routeLabel: '1',
    accent: 'subway',
  },
];

const streetcarStops: TransitStop[] = [
  { id: '506-west', direction: 'WEST', routeLabel: '506', accent: 'route' },
  { id: '506-east', direction: 'EAST', routeLabel: '506', accent: 'route' },
];

const busStops: TransitStop[] = [
  { id: '94-west', direction: 'WEST', routeLabel: '94', accent: 'route' },
  { id: '94-east', direction: 'EAST', routeLabel: '94', accent: 'route' },
];

function formatTimeLabel(date: Date) {
  const hours = date.getHours();
  const suffix = hours < 12 ? 'AM' : 'PM';
  const normalized = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${normalized}:${minutes} ${suffix}`;
}

export function TransitWidget() {
  const [data, setData] = useState<Record<string, { times: string[]; error?: string }>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch('/api/transit');
        const payload = (await response.json()) as TransitApiResponse;
        if (!cancelled) {
          setData(payload.results);
          setLastUpdated(new Date(payload.updatedAt));
        }
      } catch (error) {
        console.error('Transit widget', error);
      }
    };

    load();
    const interval = setInterval(load, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const timestampLabel = useMemo(() => {
    if (!lastUpdated) return '—';
    return formatTimeLabel(lastUpdated);
  }, [lastUpdated]);

  const renderTimes = (id: string) => {
    const entry = data[id];
    if (!entry) return <span className="text-neutral-500">…</span>;
    if (entry.error) return <span className="text-rose-400">Err</span>;
    if (entry.times.length === 0) return <span className="text-neutral-500">--</span>;

    const [first, second] = entry.times;
    return (
      <span className="inline-flex items-baseline gap-2 justify-center">
        <span>{first}</span>
        {second ? <span className="text-sm text-neutral-400">{second}</span> : null}
      </span>
    );
  };

  const section = (
    label: string,
    stops: TransitStop[],
  ) => (
    <div className="rounded-lg border border-neutral-700 bg-neutral-800/60">
      <div className="flex items-center justify-between border-b border-neutral-700 px-4 py-2 text-xs tracking-wide text-neutral-400">
        <span>{label}</span>
        <span>Last updated {timestampLabel}</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-neutral-700">
        {stops.map((stop) => (
          <div key={stop.id} className="px-4 py-5 text-center">
            <div className="text-xs uppercase text-neutral-500">{stop.direction}</div>
            <div
              className={`text-3xl font-extrabold ${
                stop.accent === 'subway' ? 'text-amber-300' : 'text-rose-400'
              }`}
            >
              {stop.routeLabel}
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-wide">{renderTimes(stop.id)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Transit</p>
          <h2 className="text-2xl font-bold">College & Yonge</h2>
          <p className="text-sm text-neutral-400">Live TTC times in both directions.</p>
        </div>
        <div className="text-right text-sm text-neutral-400">
          <div>{timestampLabel}</div>
          <div className="text-xs">Auto-refresh every 30s</div>
        </div>
      </div>
      <div className="space-y-4 text-lg md:text-xl">
        {section('Line 1 - Subway', subwayStops)}
        {section('506 Carlton', streetcarStops)}
        {section('94 Wellesley', busStops)}
      </div>
    </div>
  );
}
