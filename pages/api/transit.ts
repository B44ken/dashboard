import type { NextApiRequest, NextApiResponse } from 'next';
import { TRANSIT_TARGETS, getNextTimes } from '../../lib/transit';

type TransitResponse = {
  updatedAt: string;
  results: Record<string, { times: string[]; error?: string }>;
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<TransitResponse>,
) {
  const entries = await Promise.all(
    TRANSIT_TARGETS.map(async (target) => {
      try {
        const times = await getNextTimes(target);
        return [target.id, { times }] as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return [target.id, { times: [], error: message }] as const;
      }
    }),
  );

  const results = Object.fromEntries(entries);

  res.status(200).json({
    updatedAt: new Date().toISOString(),
    results,
  });
}
