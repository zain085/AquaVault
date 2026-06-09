import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Zap, X } from "lucide-react";

// Beverage Configuration with Hydration Multipliers
const BEVERAGES = [
  { id: "water", name: "Water", emoji: "💧", factor: 1.0, color: "#00E5CC" },
  { id: "coffee", name: "Coffee", emoji: "☕", factor: 0.8, color: "#F5A623" },
  { id: "electrolyte", name: "Sport", emoji: "⚡", factor: 1.1, color: "#6C63FF" },
];

function LiquidRing({ pct, total }) {
  const r = 96, cx = 112, cy = 112;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);

  // Calculate wave vertical translation level based on completion percent
  // 0% pct = bottom (y=150), 100% pct = top (y=40)
  const waveY = 155 - (Math.min(pct, 100) / 100) * 115;

  return (
    <div className="relative flex items-center justify-center w-56 h-56">
      <div
        className="absolute rounded-full w-44 h-44 overflow-hidden"
        style={{
          background: `radial-gradient(circle, rgba(0,229,204,${Math.min(pct, 100) * 0.003 + 0.04}) 0%, transparent 70%)`,
          maskImage: "radial-gradient(circle, white 100%, black 100%)",
          WebkitMaskImage: "-webkit-radial-gradient(circle, white 68%, black 70%)",
        }}
      >
        {/* 🌊 DYNAMIC BACKGROUND LIQUID WAVES */}
        <AnimatePresence>
          {pct > 0 && (
            <div className="absolute inset-0 w-full h-full pointer-events-none origin-bottom">
              {/* Back Wave */}
              <motion.svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute w-[200%] h-24 opacity-25 left-0"
                animate={{ x: ["0%", "-50%"], y: waveY }}
                transition={{
                  x: { repeat: Infinity, duration: 4, ease: "linear" },
                  y: { duration: 0.8 },
                }}
              >
                <path d="M0,50 Q25,40 50,50 T100,50 L100,100 L0,100 Z" fill="#6C63FF" />
              </motion.svg>

              {/* Front Wave */}
              <motion.svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute w-[200%] h-24 opacity-40 -left-1/2"
                animate={{ x: ["0%", "-50%"], y: waveY - 4 }}
                transition={{
                  x: { repeat: Infinity, duration: 2.8, ease: "linear" },
                  y: { duration: 0.8 },
                }}
              >
                <path d="M0,50 Q25,43 50,50 T100,50 L100,100 L0,100 Z" fill="#00E5CC" />
              </motion.svg>
            </div>
          )}
        </AnimatePresence>
      </div>

      <svg width={224} height={224} className="-rotate-90 relative z-10 pointer-events-none">
        <defs>
          <linearGradient id="ringG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5CC" />
            <stop offset="100%" stopColor="#6C63FF" />
          </linearGradient>
          <filter id="blur2">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1A2F3D" strokeWidth={14} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#ringG)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          filter="url(#blur2)"
          opacity={0.35}
          className="transition-all duration-1000 cubic-bezier-[0.34,1.56,0.64,1]"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#ringG)"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-1000 cubic-bezier-[0.34,1.56,0.64,1]"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 z-20 pointer-events-none">
        <span className="text-[11px] text-[#8CA3B5] tracking-widest uppercase font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
          Today
        </span>
        <span className="text-4xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] line-height-1">
          {Math.round(pct)}%
        </span>
        <span className="text-white font-bold text-sm drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          {total} ml
        </span>
      </div>
    </div>
  );
}

function Bubble({ x, y, size }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none border border-[rgba(0,229,204,0.3)] z-30"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: "radial-gradient(circle at 35% 35%, rgba(0,229,204,0.6), rgba(0,229,204,0.1))",
      }}
      initial={{ opacity: 0.7, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -80, scale: 0.1 }}
      transition={{ duration: 1.4, ease: "easeOut" }}
    />
  );
}

export default function HomeView({
  data,
  addWater,
  deleteWater,
  greeting,
  motivation,
  todayStr,
  setView,
}) {
  const { profile, logs } = data;
  const today = todayStr();
  const todayLog = logs.find((l) => l.date === today) || { date: today, entries: [], total: 0 };
  const goal = profile?.dailyGoal || 2500;
  const total = todayLog.total;
  const pct = Math.min((total / goal) * 100, 100);
  const remaining = Math.max(goal - total, 0);

  const [bubbles, setBubbles] = useState([]);
  
  // 🎚️ State context for inline Custom fluid selector slider
  const [customSliderVal, setCustomSliderVal] = useState(350);

  // 🥤 Active Beverage Type State Context Selector
  const [selectedBev, setSelectedBev] = useState(BEVERAGES[0]);

  // 🏆 Programmatic tracker evaluating achievements milestones
  const badgeCount = useMemo(() => {
    const historyVolume = logs.reduce((sum, l) => sum + l.total, 0);
    const totalEntriesCount = logs.reduce((sum, l) => sum + l.entries.length, 0);
    const totalDaysHit = logs.filter((l) => l.total >= goal).length;

    const maxSingleSip = logs.reduce((m, l) => {
      const highest = l.entries.reduce((max, e) => (e.amount > max ? e.amount : max), 0);
      return highest > m ? highest : m;
    }, 0);

    const allEntries = logs.reduce((arr, l) => [...arr, ...l.entries], []);
    const morningSips = allEntries.filter((e) => new Date(e.timestamp).getHours() < 9).length;
    const nightSips = allEntries.filter((e) => new Date(e.timestamp).getHours() >= 21).length;

    const weekendHits = logs.filter((l) => {
      const day = new Date(l.date + "T12:00").getDay();
      return (day === 0 || day === 6) && l.total >= goal;
    }).length;

    const baseUnlockedCount = [
      logs.some((l) => l.total > 0),
      logs.filter((l) => l.total >= goal).length >= 3,
      maxSingleSip >= 500,
      historyVolume >= 10000,
      morningSips >= 3,
      nightSips >= 3,
      totalEntriesCount >= 25,
      totalDaysHit >= 7,
      weekendHits >= 2,
      historyVolume > 0,
      historyVolume >= 50000,
    ].filter(Boolean).length;

    return baseUnlockedCount + (baseUnlockedCount >= 6 ? 1 : 0);
  }, [logs, goal]);

  const handleAdd = useCallback(
    (amount) => {
      const adjustedAmount = Math.round(amount * selectedBev.factor);
      addWater(adjustedAmount);

      setBubbles((b) => [
        ...b.slice(-8),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: Date.now() + i,
          x: `${20 + Math.random() * 60}%`,
          y: `${35 + Math.random() * 35}%`,
          size: 6 + Math.random() * 12,
        })),
      ]);
    },
    [addWater, selectedBev],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-6 pb-28"
    >
      {/* HEADER SECTION */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-xs text-[#8CA3B5]">{greeting()}</p>
          <h1 className="text-2xl font-black text-white mt-0.5">
            {profile?.name || "Friend"}
          </h1>

          {/* Level Status Tag */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5CC] animate-pulse" />
            <span className="text-[10px] font-bold text-[#00E5CC] uppercase tracking-wider">
              Level {Math.floor(logs.reduce((s, l) => s + l.total, 0) / 1000) + 1} •{" "}
              {badgeCount >= 10
                ? "Hydration Deity"
                : badgeCount >= 6
                  ? "Liquid Warlock"
                  : badgeCount >= 3
                    ? "Aqua Soldier"
                    : "Dehydrated Novice"}
            </span>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-[rgba(0,229,204,0.1)] text-[#00E5CC] border border-[rgba(0,229,204,0.2)] text-xs font-bold">
          Goal: {goal} ml
        </div>
      </div>

      {/* VISUAL RING AND BUBBLES */}
      <div className="relative flex justify-center">
        {bubbles.map((b) => (
          <Bubble key={b.id} {...b} />
        ))}
        <LiquidRing pct={pct} total={total} />
      </div>

      {/* MOTIVATION BANNER */}
      <div className="rounded-2xl p-4 flex items-center gap-3 bg-[#111827] border border-white/5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[rgba(0,229,204,0.12)]">
          <Zap size={18} className="text-[#00E5CC]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">{motivation(pct)}</p>
          <p className="text-xs text-[#8CA3B5] mt-0.5">
            {remaining > 0 ? `${remaining} ml to go` : "Daily target reached 🎉"}
          </p>
        </div>
      </div>

      {/* STREAK FIRE BURST RING */}
      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="rounded-2xl p-4 bg-gradient-to-br from-[#111827] to-[#161D2B] border border-white/5 relative overflow-hidden flex items-center justify-between"
      >
        <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-[#F5A623]/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div 
              animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 rounded-xl bg-[#F5A623] blur-sm"
            />
            <div className="w-11 h-11 rounded-xl bg-[#F5A623]/15 border border-[#F5A623]/30 flex items-center justify-center text-xl relative z-10">
              🔥
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8CA3B5]">Hydration Streak</p>
            <p className="text-[11px] text-[#8CA3B5]/60 mt-0.5">Don't let your vault fire die out</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black bg-gradient-to-r from-[#F5A623] to-[#FF5A79] bg-clip-text text-transparent">
            {logs.filter(l => l.total >= goal).length}d
          </span>
          <p className="text-[9px] uppercase font-black text-[#FF5A79] tracking-widest mt-0.5">Active Run</p>
        </div>
      </motion.div>

      {/* TROPHY ROOM RIBBON ROUTER */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setView("stats")}
        className="w-full rounded-2xl p-3.5 flex items-center justify-between bg-gradient-to-r from-[rgba(108,99,255,0.08)] to-[rgba(0,229,204,0.04)] border border-[rgba(108,99,255,0.18)] hover:border-[rgba(0,229,204,0.3)] transition-colors text-left focus:outline-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#6C63FF]/10 text-base">
            🏆
          </div>
          <div>
            <p className="text-white font-bold text-xs flex items-center gap-1.5">
              AquaVault Trophy Room
              <span className="text-[9px] font-medium text-[#8CA3B5]/70 bg-white/5 px-1 rounded">
                View details →
              </span>
            </p>
            <p className="text-[11px] text-[#8CA3B5] mt-0.5">Complete achievements to lock in badges.</p>
          </div>
        </div>
        <div className="text-right flex flex-col justify-center">
          <span className="text-xs font-black text-[#00E5CC]">{badgeCount} / 12</span>
          <p className="text-[9px] uppercase font-bold text-[#6C63FF] tracking-wider mt-0.5">Earned</p>
        </div>
      </motion.button>

      {/* BEVERAGE TYPE SELECTION MENU */}
      <div>
        <p className="text-[#8CA3B5] text-[11px] font-semibold uppercase tracking-wider mb-2">
          Liquid Type
        </p>
        <div className="grid grid-cols-3 gap-2 bg-[#111827] p-1.5 rounded-2xl border border-white/5">
          {BEVERAGES.map((b) => {
            const isSelected = selectedBev.id === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBev(b)}
                className="py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                style={{
                  background: isSelected ? "rgba(255,255,256,0.04)" : "transparent",
                  color: isSelected ? b.color : "#8CA3B5",
                  border: isSelected ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
                }}
              >
                <span>{b.emoji}</span>
                <span>{b.name}</span>
                <span className="text-[10px] opacity-60 font-medium">({b.factor}x)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* QUICK ADD INTAKE BUTTON SET */}
      <div>
        <p className="text-[#8CA3B5] text-[11px] font-semibold uppercase tracking-wider mb-2.5">
          Quick Add
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { amount: 100, label: "Sip", sub: "100 ml" },
            { amount: 250, label: "Cup", sub: "250 ml" },
            { amount: 500, label: "Bottle", sub: "500 ml" },
          ].map(({ amount, label, sub }) => (
            <motion.button
              key={amount}
              whileTap={{ scale: 0.93 }}
              onClick={() => handleAdd(amount)}
              className="rounded-2xl p-4 flex flex-col items-center gap-1.5 transition-all bg-[#111827] border border-white/5 relative overflow-hidden group"
            >
              <Droplets size={22} style={{ color: selectedBev.color }} className="transition-colors duration-300" />
              <span className="text-white font-bold text-xs">{label}</span>
              <span className="text-[#8CA3B5] text-[11px]">{sub}</span>

              {selectedBev.factor !== 1 && (
                <span className="absolute top-1 right-1 text-[9px] font-extrabold px-1 rounded bg-white/5 text-white/40 scale-90">
                  {Math.round(amount * selectedBev.factor)}ml
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* 🎚️ SINGLE SOURCE TRUTH: INLINE DYNAMIC CUSTOM SLIDER */}
        <div className="p-4 rounded-2xl bg-[#111827] border border-white/5 mt-4">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[11px] text-[#8CA3B5] font-semibold uppercase tracking-wider">Custom Fluid Slider</span>
            <span className="text-xs font-black text-[#00E5CC] bg-[#00E5CC]/10 px-2 py-0.5 rounded-lg">
              {customSliderVal} ml
            </span>
          </div>
          <input 
            type="range" 
            min="50" 
            max="1000" 
            step="50"
            value={customSliderVal}
            onChange={(e) => setCustomSliderVal(Number(e.target.value))}
            className="w-full h-1.5 rounded-lg appearance-none bg-[#1A2F3D] accent-[#00E5CC] cursor-pointer"
            style={{
              background: `linear-gradient(to right, #00E5CC 0%, #00E5CC ${(customSliderVal - 50) / 9.5}%, #1A2F3D ${(customSliderVal - 50) / 9.5}%, #1A2F3D 100%)`
            }}
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAdd(customSliderVal)}
            className="w-full mt-3 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#00E5CC] to-[#6C63FF] text-[#0A0B0F] shadow-lg shadow-[#00E5CC]/10"
          >
            Log Dynamic Volume
          </motion.button>
        </div>
      </div>

      {/* TODAY'S LOGS CONTAINER WITH PHYSICS-BASED SPRING RETRACTION */}
      <div>
        <p className="text-[#8CA3B5] text-[11px] font-semibold uppercase tracking-wider mb-2.5">
          Today's Log
        </p>
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {[...todayLog.entries]
              .reverse()
              .map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -30, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#111827] border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(0,229,204,0.1)]">
                      <Droplets size={15} className="text-[#00E5CC]" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {entry.amount} ml
                      </p>
                      <p className="text-[#8CA3B5] text-[11px]">
                        {new Date(entry.timestamp).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteWater(entry.id, entry.amount)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
          </AnimatePresence>

          {todayLog.entries.length === 0 && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.4 }} 
              className="text-xs text-[#8CA3B5] text-center py-6 italic"
            >
              No logs recorded in the vault today yet.
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}