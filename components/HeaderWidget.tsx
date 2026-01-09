"use client";

import { useEffect, useState } from "react"

export default () => {
  const [date, setDate] = useState(new Date())
  const [weather, setWeather] = useState<{ now: number, hi: number, lo: number } | null>(null)
  const pad = (n: number) => String(n).padStart(2, "0")

  useEffect(() => {
    const id = setInterval(() => setDate(new Date()), 15_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=43.6532&longitude=-79.3832&current=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FToronto")
        const data = await res.json()
        setWeather({
          now: Math.round(data.current.temperature_2m),
          hi: Math.round(data.daily.temperature_2m_max[0]),
          lo: Math.round(data.daily.temperature_2m_min[0])
        })
      } catch (e) {
        console.error("Weather fetch failed", e)
      }
    }
    fetchWeather()
    const id = setInterval(fetchWeather, 900_000) // 15 mins
    return () => clearInterval(id)
  }, [])

  return <div className="HeaderWidget flex justify-center items-center gap-4">
    <div className="font-bold">
      {pad(date.getHours() % 12 || 12)}:{pad(date.getMinutes())} {date.getHours() < 12 ? "AM" : "PM"}
    </div>
    {weather && <div className="text-xl text-gray-400 font-mono tracking-tighter">
      {weather.now}<sup>*</sup> now {weather.hi}<sup>*</sup> hi {weather.lo}<sup>*</sup> lo
    </div>}
  </div>
}