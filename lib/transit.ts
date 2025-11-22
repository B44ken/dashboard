export type TransitType = 'bus' | 'subway';

export interface TransitTarget {
  id: string;
  type: TransitType;
  route: string;
  stopId: string;
  directionLabel: string;
  routeLabel?: string;
}

const subwayTargets: TransitTarget[] = [
  {
    id: 'subway-south',
    type: 'subway',
    route: '1',
    stopId: '13807',
    directionLabel: 'UNION',
    routeLabel: '1',
  },
  {
    id: 'subway-north',
    type: 'subway',
    route: '1',
    stopId: '13808',
    directionLabel: 'FINCH',
    routeLabel: '1',
  },
];

const surfaceTargets: TransitTarget[] = [
  {
    id: '506-west',
    type: 'bus',
    route: '506',
    stopId: '752',
    directionLabel: 'WEST',
    routeLabel: '506',
  },
  {
    id: '506-east',
    type: 'bus',
    route: '506',
    stopId: '751',
    directionLabel: 'EAST',
    routeLabel: '506',
  },
  {
    id: '94-west',
    type: 'bus',
    route: '94',
    stopId: '8627',
    directionLabel: 'WEST',
    routeLabel: '94',
  },
  {
    id: '94-east',
    type: 'bus',
    route: '94',
    stopId: '8626',
    directionLabel: 'EAST',
    routeLabel: '94',
  },
];

export const TRANSIT_TARGETS: TransitTarget[] = [
  ...subwayTargets,
  ...surfaceTargets,
];

async function fetchSubway(stopId: string) {
  const url = `https://ntas.ttc.ca/api/ntas/get-next-train-time/${stopId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Subway request failed: ${response.status}`);
  }
  const data = (await response.json()) as Array<{ nextTrains?: string }>;
  if (data && data.length > 0 && data[0].nextTrains) {
    return data[0].nextTrains.split(',').map((value) => value.trim());
  }
  return [] as string[];
}

async function fetchBus(route: string, stopId: string) {
  const url = `https://www.ttc.ca/ttcapi/routedetail/GetNextBuses?routeId=${route}&stopCode=${stopId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Bus request failed: ${response.status}`);
  }
  const data = (await response.json()) as Array<{ nextBusMinutes?: string }>;
  if (data && Array.isArray(data)) {
    return data
      .map((entry) => entry.nextBusMinutes)
      .filter((value): value is string => Boolean(value));
  }
  return [] as string[];
}

export async function getNextTimes(target: TransitTarget) {
  if (target.type === 'subway') {
    return fetchSubway(target.stopId);
  }
  return fetchBus(target.route, target.stopId);
}
