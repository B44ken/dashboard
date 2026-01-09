"use client";

import { useEffect, useState } from "react"

export default () => {
  const [date, setDate] = useState(new Date())
  const pad = (n: number) => String(n).padStart(2, "0")

  useEffect(() => {
    const id = setInterval(() => setDate(new Date()), 15_000)
    return () => clearInterval(id)
  })

  return <div className="ClockWidget">
    {pad(date.getHours() % 12)}:{pad(date.getMinutes())} {date.getHours() < 12 ? "AM" : "PM"}
  </div>
}