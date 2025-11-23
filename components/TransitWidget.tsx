"use client";

import { useEffect, useState } from "react";

type TargetConfig = {
  type: "bus" | "subway";
  r?: string;
  stopId: string;
};

type TimeEntry = {
  primary?: string;
  secondary?: string;
  error?: boolean;
  empty?: boolean;
};

const PROXY = "https://corsproxy.io/?";

const TARGETS: Record<string, TargetConfig> = {
  "94-east": { type: "bus", r: "94", stopId: "8626" },
  "94-west": { type: "bus", r: "94", stopId: "8627" },
  "506-east": { type: "bus", r: "506", stopId: "751" },
  "506-west": { type: "bus", r: "506", stopId: "752" },
  "subway-south": { type: "subway", r: "1", stopId: "13807" },
  "subway-north": { type: "subway", r: "1", stopId: "13808" },
};

async function fetchSubway(stopId: string): Promise<string[]> {
  const url = `https://ntas.ttc.ca/api/ntas/get-next-train-time/${stopId}`;
  const res = await fetch(PROXY + encodeURIComponent(url));
  const data = await res.json();
  if (data && data.length > 0 && data[0].nextTrains) {
    return String(data[0].nextTrains)
      .split(",")
      .map((t: string) => t.trim());
  }
  return [];
}

async function fetchBus(route: string, stopId: string): Promise<string[]> {
  const url = `https://www.ttc.ca/ttcapi/routedetail/GetNextBuses?routeId=${route}&stopCode=${stopId}`;
  const res = await fetch(PROXY + encodeURIComponent(url));
  const data = await res.json();
  if (data && Array.isArray(data)) {
    return data.map((b: { nextBusMinutes: string }) => b.nextBusMinutes);
  }
  return [];
}

const TransitWidget: React.FC = () => {
  const [entries, setEntries] = useState<Record<string, TimeEntry>>({});

  const updateTimes = async (key: string) => {
    const cfg = TARGETS[key];
    let times: string[] = [];

    try {
      if (cfg.type === "subway") {
        times = await fetchSubway(cfg.stopId);
      } else if (cfg.r) {
        times = await fetchBus(cfg.r, cfg.stopId);
      }

      if (times.length === 0) {
        setEntries((prev) => ({ ...prev, [key]: { empty: true } }));
      } else {
        const [t1, t2] = times;
        setEntries((prev) => ({
          ...prev,
          [key]: { primary: t1, secondary: t2 },
        }));
      }
    } catch (e) {
      console.error(key, e);
      setEntries((prev) => ({ ...prev, [key]: { error: true } }));
    }
  };

  const updateAll = async () => {
    await Promise.all(Object.keys(TARGETS).map(updateTimes));
  };

  useEffect(() => {
    updateAll();
    const id = setInterval(updateAll, 30000);
    return () => clearInterval(id);
  }, []);

  const renderTimeCell = (key: string) => {
    const entry = entries[key];

    if (!entry || entry.empty) {
      return (
        <div className="text-[1.4em] widget-number-main">
          <span className="widget-number-empty">--</span>
        </div>
      );
    }

    if (entry.error) {
      return (
        <div className="text-[1.4em] widget-number-main">
          <span className="widget-number-error">Err</span>
        </div>
      );
    }

    return (
      <div className="text-[1.4em] widget-number-main">
        <span className="inline-block">{entry.primary}</span>
        {entry.secondary !== undefined && (
          <span className="text-[0.7em] text-widget-muted ml-[6px]">
            {entry.secondary}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="widget-card overflow-hidden text-[2em] grid">
      {/* Subway row */}
      <div className="flex flex-row">
        <div className="flex-1 p-3 text-center border-r border-[#333]">
          <div className="widget-label-small">COLLEGE</div>
          <div className="text-[1.4em] widget-number-main text-subway-yellow">
            1
          </div>
        </div>
        <div className="flex-1 p-3 text-center border-r border-[#333]">
          <div className="widget-label-small">UNION</div>
          {renderTimeCell("subway-south")}
        </div>
        <div className="flex-1 p-3 text-center">
          <div className="widget-label-small">FINCH</div>
          {renderTimeCell("subway-north")}
        </div>
      </div>

      {/* 506 row */}
      <div className="flex flex-row">
        <div className="flex-1 text-center border-r border-[#333]">
          <div className="widget-label-small">CHURCH</div>
          <div className="text-[1.4em] widget-number-main text-[#ff3b30]">
            506
          </div>
        </div>
        <div className="flex-1 text-center border-r border-[#333]">
          <div className="widget-label-small">WEST</div>
          {renderTimeCell("506-west")}
        </div>
        <div className="flex-1 text-center">
          <div className="widget-label-small">EAST</div>
          {renderTimeCell("506-east")}
        </div>
      </div>

      {/* 94 row */}
      <div className="flex flex-row">
        <div className="flex-1 p-3 text-center border-r border-[#333]">
          <div className="widget-label-small">CHURCH</div>
          <div className="text-[1.4em] widget-number-main text-[#ff3b30]">
            94
          </div>
        </div>
        <div className="flex-1 p-3 text-center border-r border-[#333]">
          <div className="widget-label-small">WEST</div>
          {renderTimeCell("94-west")}
        </div>
        <div className="flex-1 p-3 text-center">
          <div className="widget-label-small">EAST</div>
          {renderTimeCell("94-east")}
        </div>
      </div>
    </div>
  );
};

export default TransitWidget;

