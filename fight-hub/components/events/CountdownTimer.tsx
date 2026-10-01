"use client";
import { useEffect, useMemo, useState } from "react";

function remaining(target: string) {
  const ms = Math.max(0, new Date(target).getTime() - Date.now());
  return { days: Math.floor(ms / 86400000), hours: Math.floor((ms / 3600000) % 24), minutes: Math.floor((ms / 60000) % 60) };
}

export function CountdownTimer({ target }: { target: string }) {
  const [time, setTime] = useState(() => remaining(target));
  useEffect(() => { const id = setInterval(() => setTime(remaining(target)), 30000); return () => clearInterval(id); }, [target]);
  const parts = useMemo(() => [[time.days, "DÍAS"], [time.hours, "HORAS"], [time.minutes, "MIN"]] as const, [time]);
  return <div className="countdown" aria-label="Cuenta regresiva">{parts.map(([value, label]) => <div key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}</div>;
}
