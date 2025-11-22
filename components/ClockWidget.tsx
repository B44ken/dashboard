"use client";

import { useEffect, useState } from "react";

export const ClockWidget: React.FC = () => {
  const [timeText, setTimeText] = useState("0:00");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hours12 = d.getHours() % 12;
      const hh = String(hours12).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ap = d.getHours() < 12 ? "A" : "P";
      setTimeText(`${hh}:${mm} ${ap}M`);
    };

    updateTime();
    const id = setInterval(updateTime, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-[3.5em] w-[700px] grid gap-[15px]">
      <div className="text-center p-3">{timeText}</div>
    </div>
  );
};

export default ClockWidget;

