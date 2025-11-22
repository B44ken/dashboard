import { useEffect, useState } from 'react';
import { WiTrain } from 'react-icons/wi';

type DirectionTimes = {
  label: string;
  times: string[];
};

export type TransitRow = {
  route: string;
  type: 'subway' | 'bus';
  dirA: DirectionTimes;
  dirB: DirectionTimes;
};

interface TransitWidgetProps {
  location: string;
  rows: TransitRow[];
}

export function TransitWidget({ location, rows }: TransitWidgetProps) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hours = d.getHours();
      const mins = `${d.getMinutes()}`.padStart(2, '0');
      const suffix = hours >= 12 ? 'PM' : 'AM';
      const display = `${((hours + 11) % 12) + 1}:${mins} ${suffix}`;
      setClock(display);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="widget-card glow-ring overflow-hidden">
      <div className="flex items-center justify-between text-sm text-muted">
        <div className="flex items-center gap-2 font-semibold text-white">
          <WiTrain className="text-xl" />
          <span>{location}</span>
        </div>
        <span>{clock}</span>
      </div>

      <div className="mt-4 space-y-2 text-center">
        {rows.map((row) => {
          const accent = row.type === 'subway' ? 'text-amber-300' : 'text-rose-300';
          return (
            <div
              key={`${row.route}-${row.dirA.label}-${row.dirB.label}`}
              className="grid grid-cols-3 items-center rounded-2xl bg-white/5 px-3 py-3 border border-white/5"
            >
              <div className="border-r border-white/5 pr-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted">{row.dirA.label}</div>
                <div className={`text-3xl font-black ${accent}`}>{row.route}</div>
              </div>

              {[row.dirA, row.dirB].map((dir) => (
                <div key={dir.label} className="flex flex-col items-center gap-1">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-muted">{dir.label}</div>
                  <div className="flex items-center gap-2 text-2xl font-bold">
                    <span>{dir.times[0] ?? '--'}</span>
                    {dir.times[1] && <span className="text-sm text-muted">{dir.times[1]}</span>}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
