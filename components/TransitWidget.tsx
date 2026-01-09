"use client";

import { useEffect, useState } from "react";

const fetchDir = async (is: "bus" | "subway", route: number, stopId: number) => {
  if (is === "bus") {
    const url = `https://www.ttc.ca/ttcapi/routedetail/GetNextBuses?routeId=${route}&stopCode=${stopId}`;
    const res = await fetch(url);
    const data = await res.json();
    return data?.map((b: { nextBusMinutes: string }) => b.nextBusMinutes) ?? [];
  } else if (is === "subway") {
    const url = `https://ntas.ttc.ca/api/ntas/get-next-train-time/${stopId}`;
    const res = await fetch(url);
    const data = await res.json();
    return data[0]?.nextTrains?.split(",").map((t: string) => t.trim());
  }
  return [];
}

const TransitLine = ({ name, route, is, stops }: { name: string, route: number, is: "bus" | "subway", stops: { name: string; id: number }[] }) => {
  const [times, setTimes] = useState<string[][]>([]);

  useEffect(() => void (async () => {
    setTimes(await Promise.all(stops.map((stop) => fetchDir(is, route, stop.id))));
  })(), [is, route, stops]);

  return <div className="flex flex-row">
    <div className="flex-1 p-1 text-center border-r border-stone-700">
      <div className="text-gray-500 text-xs">{name}</div>
      <div className={`text-4xl font-bold ${is == "bus" ? "text-red-500" : "text-yellow-300"}`}>{route}</div>
    </div>
    {stops.map((s, i) => <div key={i} className="flex-1 p-1 text-center border-r border-stone-700 *:mx-1" >
      <div className="text-gray-500 text-xs">{s.name}</div>
      <span className="text-4xl font-bold">{times[i]?.[0] || "-"}</span>
      <span className="text-2xl text-gray-500 font-bold">{times[i]?.[1]}</span>
    </div>)}
  </div >
}

export default () => {
  const [clock, setClock] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  return <div className="TransitWidget py-2">
    <TransitLine name="COLLEGE" route={1} is="subway" stops={[{ name: "UNION", id: 13807 }, { name: "FINCH", id: 13808 }]} />
    <TransitLine name="COLLEGE" route={506} is="bus" stops={[{ name: "WEST", id: 752 }, { name: "EAST", id: 751 }]} />
    <TransitLine name="CHURCH" route={94} is="bus" stops={[{ name: "WEST", id: 8627 }, { name: "EAST", id: 8626 }]} />
  </div>
};