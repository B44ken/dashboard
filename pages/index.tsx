import Head from 'next/head';
import { SpotifyWidget } from '../components/SpotifyWidget';
import { TransitWidget } from '../components/TransitWidget';
import { WidgetGrid } from '../components/WidgetGrid';

export default function Home() {
  return (
    <>
      <Head>
        <title>Ambient Dashboard</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <main className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Dashboard</p>
          <h1 className="text-4xl font-bold">Living Room Display</h1>
          <p className="text-neutral-400">
            Modular widgets for transit, music, and more. Styled for a TV-friendly glanceable layout.
          </p>
        </header>

        <WidgetGrid>
          <TransitWidget />
          <SpotifyWidget />
          <div className="card flex items-center justify-center p-6 text-center text-neutral-400">
            <div>
              <p className="text-sm uppercase tracking-[0.25em]">Coming soon</p>
              <p className="text-xl font-semibold text-neutral-100">Weather + Reminders</p>
              <p className="text-sm text-neutral-500">Plug in more widgets as you go.</p>
            </div>
          </div>
        </WidgetGrid>
      </main>
    </>
  );
}
