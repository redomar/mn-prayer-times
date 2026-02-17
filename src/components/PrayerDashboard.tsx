"use client";

import { useEffect, useState, useMemo } from "react";
import { timetable } from "../app/client";
import { Card, CardContent } from "@/components/ui/card";

/* ─── helpers ─── */

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function nowMinutes(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes() + n.getSeconds() / 60;
}

function getNextPrayer(today: timetable.PrayerTimes): {
  name: string;
  time: string;
  label?: string;
} {
  const now = new Date();
  const prayers = [
    { name: "Fajr", time: today.fajrJamat, label: "Suhoor ends" },
    { name: "Dhuhr", time: today.dhuhrJamat },
    { name: "Asr", time: today.asrJamat },
    { name: "Maghrib", time: today.maghribJamat, label: "Iftar" },
    { name: "Isha", time: today.ishaJamat },
  ];

  const currentDate = now.toISOString().split("T")[0];

  for (const prayer of prayers) {
    const prayerTime = new Date(`${currentDate}T${prayer.time}`);
    if (prayerTime > now) return prayer;
  }

  return { name: "Fajr", time: today.fajr, label: "Suhoor ends" };
}

function getTimeUntilDetailed(timeString: string): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  const targetTime = new Date(`${currentDate}T${timeString}`);

  if (targetTime < now) targetTime.setDate(targetTime.getDate() + 1);

  const diff = targetTime.getTime() - now.getTime();
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

/* ─── Heliodon SVG ─── */

function Heliodon({
  fajr,
  sunrise,
  maghrib,
}: {
  fajr: string;
  sunrise: string;
  maghrib: string;
}) {
  const [currentMinutes, setCurrentMinutes] = useState(nowMinutes);

  useEffect(() => {
    const id = setInterval(() => setCurrentMinutes(nowMinutes()), 30_000);
    return () => clearInterval(id);
  }, []);

  const fajrM = timeToMinutes(fajr);
  const sunriseM = timeToMinutes(sunrise);
  const maghribM = timeToMinutes(maghrib);

  // Sun travels from sunrise to maghrib across the arc
  const daySpan = maghribM - sunriseM;
  // Progress: 0 = sunrise, 1 = maghrib
  const progress = Math.max(0, Math.min(1, (currentMinutes - sunriseM) / daySpan));
  const isBelowHorizon = currentMinutes < sunriseM || currentMinutes > maghribM;

  // SVG dimensions (viewBox)
  const W = 400;
  const H = 140;
  const horizonY = H - 20;
  const arcCx = W / 2;
  const arcRx = (W - 60) / 2; // horizontal radius
  const arcRy = horizonY - 20; // vertical radius (how high the arc goes)

  // Sun position on the elliptical arc
  // angle goes from PI (left) to 0 (right)
  const angle = Math.PI * (1 - progress);
  const sunX = arcCx + arcRx * Math.cos(angle);
  const sunY = horizonY - arcRy * Math.sin(angle);

  // For below-horizon, place sun below the horizon line
  const displaySunY = isBelowHorizon ? horizonY + 15 : sunY;
  const displaySunX = isBelowHorizon
    ? currentMinutes < sunriseM
      ? 30 + ((currentMinutes - fajrM) / (sunriseM - fajrM)) * (W / 2 - 30)
      : W / 2 + ((currentMinutes - maghribM) / (24 * 60 - maghribM)) * (W / 2 - 30)
    : sunX;

  // Arc path (semicircle above horizon)
  const arcPath = `M 30 ${horizonY} A ${arcRx} ${arcRy} 0 0 1 ${W - 30} ${horizonY}`;

  // Fajr marker position (on the left, below horizon, marking the start of twilight)
  const fajrX = 30;

  return (
    <div className="heliodon-container">
      <svg
        viewBox={`0 0 ${W} ${H + 10}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Sky gradient behind arc */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={isBelowHorizon ? "hsl(230, 50%, 12%)" : "hsl(210, 60%, 80%)"}
              stopOpacity="0.15"
            />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="sunGlow">
            <stop offset="0%" stopColor="hsl(38, 80%, 65%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(38, 80%, 65%)" stopOpacity="0" />
          </radialGradient>
          {/* Crescent moon gradient */}
          <radialGradient id="moonGlow">
            <stop offset="0%" stopColor="hsl(38, 60%, 85%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(38, 60%, 85%)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky fill */}
        <path d={`${arcPath} L ${W - 30} 0 L 30 0 Z`} fill="url(#skyGrad)" />

        {/* Horizon line */}
        <line
          x1="10"
          y1={horizonY}
          x2={W - 10}
          y2={horizonY}
          className="heliodon-horizon"
          strokeDasharray="2 4"
        />

        {/* Arc path (dashed) */}
        <path d={arcPath} className="heliodon-arc" />

        {/* Fajr marker */}
        <line
          x1={fajrX}
          y1={horizonY - 4}
          x2={fajrX}
          y2={horizonY + 4}
          stroke="hsl(230, 60%, 60%)"
          strokeWidth="2"
        />
        <text
          x={fajrX}
          y={horizonY + 16}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="8"
          fontFamily="inherit"
        >
          Fajr
        </text>

        {/* Sunrise marker */}
        <line
          x1={30}
          y1={horizonY - 4}
          x2={30}
          y2={horizonY + 4}
          stroke="hsl(38, 70%, 60%)"
          strokeWidth="2"
          opacity="0.6"
        />
        <text
          x={50}
          y={horizonY + 16}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="8"
          fontFamily="inherit"
        >
          Sunrise
        </text>

        {/* Maghrib marker */}
        <line
          x1={W - 30}
          y1={horizonY - 4}
          x2={W - 30}
          y2={horizonY + 4}
          stroke="hsl(25, 70%, 55%)"
          strokeWidth="2"
        />
        <text
          x={W - 50}
          y={horizonY + 16}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="8"
          fontFamily="inherit"
        >
          Maghrib
        </text>

        {/* Sun glow */}
        {!isBelowHorizon && (
          <circle
            cx={displaySunX}
            cy={displaySunY}
            r="22"
            fill="url(#sunGlow)"
            className="heliodon-glow"
          />
        )}

        {/* Sun / Moon */}
        {isBelowHorizon ? (
          /* Crescent moon when sun is below horizon */
          <g
            transform={`translate(${W / 2}, ${horizonY - arcRy * 0.6})`}
            className="float"
          >
            <circle cx="0" cy="0" r="16" fill="url(#moonGlow)" />
            <path
              d="M 5 -10 A 10 10 0 0 1 5 10 A 7 10 0 0 0 5 -10"
              fill="hsl(38, 60%, 82%)"
              stroke="hsl(38, 50%, 70%)"
              strokeWidth="0.5"
              opacity="0.9"
            />
          </g>
        ) : (
          /* Sun circle */
          <circle
            cx={displaySunX}
            cy={displaySunY}
            r="8"
            fill="hsl(38, 85%, 65%)"
            stroke="hsl(38, 80%, 55%)"
            strokeWidth="1"
            className="heliodon-sun"
          />
        )}

        {/* Time labels on horizon */}
        <text
          x="10"
          y={horizonY - 6}
          className="fill-muted-foreground"
          fontSize="7"
          fontFamily="inherit"
          opacity="0.5"
        >
          {fajr}
        </text>
        <text
          x={W - 10}
          y={horizonY - 6}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize="7"
          fontFamily="inherit"
          opacity="0.5"
        >
          {maghrib}
        </text>
      </svg>
    </div>
  );
}

/* ─── Stars Background ─── */

function StarsBackground() {
  const stars = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 60}%`,
      size: Math.random() * 2 + 1,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 3}s`,
    }));
  }, []);

  return (
    <div className="stars-container">
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            ["--duration" as string]: s.duration,
            ["--delay" as string]: s.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Main Dashboard ─── */

export function PrayerDashboard({
  today,
  locationName = "",
}: {
  today: timetable.PrayerTimes;
  locationName?: string;
}) {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [nextPrayer, setNextPrayer] = useState(() => getNextPrayer(today));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const next = getNextPrayer(today);
      setNextPrayer(next);
      setCountdown(getTimeUntilDetailed(next.time));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [today]);

  const prayers = [
    { name: "Fajr", time: today.fajr, jamat: today.fajrJamat, ramadanLabel: "Suhoor ends", icon: "🌙" },
    { name: "Sunrise", time: today.sunrise, jamat: null, icon: "🌅" },
    { name: "Dhuhr", time: today.dhuhr, jamat: today.dhuhrJamat, icon: "☀️" },
    { name: "Asr", time: today.asr, jamat: today.asrJamat, icon: "🌤" },
    { name: "Maghrib", time: today.maghrib, jamat: today.maghribJamat, ramadanLabel: "Iftar", icon: "🌇" },
    { name: "Isha", time: today.isha, jamat: today.ishaJamat, icon: "✨" },
  ];

  const isFajrOrMaghrib = nextPrayer.name === "Fajr" || nextPrayer.name === "Maghrib";
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="space-y-6 relative">
      <StarsBackground />
      <div className="ramadan-sky" />

      {/* ─── Suhoor & Iftar Hero Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Suhoor Card */}
        <Card className="glass-gold suhoor-card lantern-glow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  Suhoor ends at
                </p>
                <p className="text-3xl font-amiri font-bold text-foreground">
                  {today.fajr}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Fajr Jamat: <span className="text-primary">{today.fajrJamat}</span>
                </p>
              </div>
              <div className="text-3xl float" aria-hidden="true">🌙</div>
            </div>
          </CardContent>
        </Card>

        {/* Iftar Card */}
        <Card className="glass-gold iftar-card lantern-glow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  Iftar at
                </p>
                <p className="text-3xl font-amiri font-bold text-foreground">
                  {today.maghrib}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Maghrib Jamat: <span className="text-primary">{today.maghribJamat}</span>
                </p>
              </div>
              <div className="text-3xl float" style={{ animationDelay: "1.5s" }} aria-hidden="true">🏮</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Heliodon + Next Prayer Countdown ─── */}
      <Card className="glass-strong lantern-glow">
        <CardContent className="p-6 pb-4">
          {/* Next prayer countdown */}
          <div className="text-center mb-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {nextPrayer.label ? nextPrayer.label : `Next Prayer`}
            </p>
            <h2 className={`text-2xl font-amiri font-bold mt-1 ${isFajrOrMaghrib ? "greeting-text" : "text-primary"}`}>
              {nextPrayer.name}
            </h2>
            {mounted && (
              <div className="flex items-center justify-center gap-1 mt-2">
                <span className="countdown-digit text-4xl font-mono font-bold">
                  {pad(countdown.hours)}
                </span>
                <span className="text-primary text-2xl font-light">:</span>
                <span className="countdown-digit text-4xl font-mono font-bold">
                  {pad(countdown.minutes)}
                </span>
                <span className="text-primary text-2xl font-light">:</span>
                <span className="countdown-digit text-4xl font-mono font-bold text-muted-foreground">
                  {pad(countdown.seconds)}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Jamat at {nextPrayer.time}
            </p>
          </div>

          {/* Heliodon */}
          <Heliodon
            fajr={today.fajr}
            sunrise={today.sunrise}
            maghrib={today.maghrib}
          />
        </CardContent>
      </Card>

      {/* ─── All Prayer Times Grid ─── */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="crescent" aria-hidden="true" />
            <h3 className="text-lg font-semibold font-amiri">
              Today&apos;s Times{locationName && ` — ${locationName}`}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {prayers.map((prayer) => {
              const isNext = prayer.name === nextPrayer.name;
              const isFasting = prayer.name === "Fajr" || prayer.name === "Maghrib";
              return (
                <div
                  key={prayer.name}
                  className={`
                    text-center p-4 rounded-lg transition-all duration-300
                    ${isNext ? "glass-gold border border-primary/30 prayer-highlight" : "glass border-border/30 hover:border-primary/20"}
                    ${isFasting ? "ring-1 ring-primary/10" : ""}
                  `}
                >
                  <div className="text-base mb-1" aria-hidden="true">{prayer.icon}</div>
                  <div className="font-semibold text-sm">{prayer.name}</div>
                  {prayer.ramadanLabel && (
                    <div className="text-[10px] uppercase tracking-wider text-primary/80 mt-0.5">
                      {prayer.ramadanLabel}
                    </div>
                  )}
                  <div className="text-lg font-mono mt-1">{prayer.time}</div>
                  {prayer.jamat && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Jamat: <span className="text-primary">{prayer.jamat}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
