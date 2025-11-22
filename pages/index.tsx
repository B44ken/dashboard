import Head from 'next/head';
import { WidgetGrid } from '../components/WidgetGrid';
import { TransitWidget, TransitRow } from '../components/TransitWidget';
import { SpotifyWidget } from '../components/SpotifyWidget';
import { HiOutlineBellAlert, HiOutlineCalendarDays } from 'react-icons/hi2';

const lines: TransitRow[] = [
  {
    route: '1',
    type: 'subway',
    dirA: { label: 'College', times: ['1', '3'] },
    dirB: { label: 'Union', times: ['Due', '4'] }
  },
  {
    route: '506',
    type: 'bus',
    dirA: { label: 'Church', times: ['2', '6'] },
    dirB: { label: 'West', times: ['4', '9'] }
  },
  {
    route: '94',
    type: 'bus',
    dirA: { label: 'Church', times: ['1', '5'] },
    dirB: { label: 'West', times: ['7', '12'] }
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-surface text-white">
      <Head>
        <title>Ambient Dashboard</title>
      </Head>

      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted">Widget Deck</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-black">Quick view</h1>
          </div>
          <div className="hidden md:flex items-center gap-3 text-muted">
            <div className="h-3 w-3 rounded-full bg-green-400" />
            <span className="text-sm">Live</span>
          </div>
        </header>

        <WidgetGrid>
          <TransitWidget location="College Station" rows={lines} />
          <SpotifyWidget />

          <div className="widget-card">
            <div className="widget-title">
              <HiOutlineCalendarDays className="text-lg" />
              <span>Reminders</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {['Water plants', 'Send update', 'Book train'].map((item) => (
                <span key={item} className="badge-pill bg-white/5 text-white/80 border border-white/5">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-title">
              <HiOutlineBellAlert className="text-lg" />
              <span>Alarm / Timer</span>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-lg font-bold">
                07:00
              </div>
              <div>
                <p className="text-white font-semibold">Wake up</p>
                <p className="text-muted text-sm">Weekdays</p>
              </div>
            </div>
          </div>
        </WidgetGrid>
      </div>
    </div>
  );
}
