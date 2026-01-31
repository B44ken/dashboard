"use client";
import { useEffect, useState } from "react";
import config from "../config";
const { start, end } = config.sleepMode;

export function SleepMode() {
    const [sleep, setSleep] = useState(false);
    useEffect(() => {
        const intv = setInterval(() => setSleep(new Date().getHours() >= start && new Date().getHours() < end), 500)
        return () => clearInterval(intv)
    }, [])
    return sleep ? <div className="fixed w-screen h-screen bg-black z-99" /> : null
}