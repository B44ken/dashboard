"use client";

import { useEffect, useState } from "react";

export const ClockWidget: React.FC = () => {
  const [timeText, setTimeText] = useState("0:00");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeText(`${String(d.getHours() % 12).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${d.getHours() < 12 ? "A" : "P"}M`);
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

