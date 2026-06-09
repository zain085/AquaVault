import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Activity, Target, Flame, Award, Trophy, ShieldAlert, Zap, Sparkles } from "lucide-react";

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="rounded-2xl p-4 bg-[#111827] border border-white/5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${accent}18` }}>
        {React.cloneElement(icon, { size: 18, style: { color: accent } })}
      </div>
      <p className="text-[#8CA3B5] text-[11px] mb-1">{label}</p>
      <p className="text-white font-extrabold text-xl">{value}</p>
    </div>
  );
}

export default function StatsView({ data }) {
  const { logs, profile } = data;
  const goal = profile?.dailyGoal || 2500;

  // 1. Generate trailing 7 calendar days for the chart
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateString = d.toISOString().split("T")[0];
      const match = logs.find((l) => l.date === dateString);
      return {
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        amount: match ? match.total : 0,
        hit: match ? match.total >= goal : false,
      };
    });
  }, [logs, goal]);

  const last7 = logs.slice(-7);
  const avgIntake = last7.length ? Math.round(last7.reduce((s, l) => s + l.total, 0) / last7.length) : 0;
  const goalsHit = last7.filter((l) => l.total >= goal).length;

  // 2. Streaks Calculations
  const streaks = useMemo(() => {
    const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    let cur = 0;
    for (let i = 0; i < sorted.length; i++) {
      const d = new Date(sorted[i].date);
      d.setHours(0, 0, 0, 0);
      const exp = new Date(todayDate);
      exp.setDate(todayDate.getDate() - i);
      if (d.getTime() !== exp.getTime()) break;
      if (sorted[i].total >= goal) cur++;
      else break;
    }
    let best = 0, tmp = 0;
    for (const l of [...logs].sort((a, b) => new Date(a.date) - new Date(b.date))) {
      if (l.total >= goal) {
        tmp++;
        if (tmp > best) best = tmp;
      } else tmp = 0;
    }
    return { current: cur, best: Math.max(best, cur) };
  }, [logs, goal]);

  // 3. Complete Expanded 12-Badge Gamification Suite
  const achievements = useMemo(() => {
    const totalVolume = logs.reduce((sum, l) => sum + l.total, 0);
    const totalEntriesCount = logs.reduce((sum, l) => sum + l.entries.length, 0);
    const totalDaysHit = logs.filter(l => l.total >= goal).length;
    
    // Find highest individual sip logged across history
    const maxSingleSip = logs.reduce((max, l) => {
      const highestEntry = l.entries.reduce((m, e) => e.amount > m ? e.amount : m, 0);
      return highestEntry > max ? highestEntry : max;
    }, 0);

    // Extract all individual entry objects across history for custom hourly evaluations
    const allEntries = logs.reduce((arr, l) => [...arr, ...l.entries], []);

    // Count morning sessions (before 9 AM local)
    const morningSips = allEntries.filter(e => {
      const hour = new Date(e.timestamp).getHours();
      return hour < 9;
    }).length;

    // Count late night sessions (after 9 PM local)
    const nightSips = allEntries.filter(e => {
      const hour = new Date(e.timestamp).getHours();
      return hour >= 21;
    }).length;

    // Count total goal hits accomplished on weekend days (Saturday=6, Sunday=0)
    const weekendHits = logs.filter(l => {
      const dayOfWeek = new Date(l.date + "T12:00").getDay();
      return (dayOfWeek === 0 || dayOfWeek === 6) && l.total >= goal;
    }).length;

    // Base foundational setup array
    const baseBadges = [
      {
        id: "first_drop",
        title: "First Deposit",
        desc: "Initiate your hydration vault by logging your first intake.",
        icon: "💧",
        unlocked: logs.some(l => l.total > 0),
        current: logs.some(l => l.total > 0) ? 1 : 0,
        target: 1,
        unit: "log",
        color: "#00E5CC",
      },
      {
        id: "hydro_beast",
        title: "Vault Commander",
        desc: "Build a solid baseline by hitting your target 3 days in a row.",
        icon: "🔥",
        unlocked: streaks.best >= 3,
        current: streaks.best,
        target: 3,
        unit: "days",
        color: "#FF5A79",
      },
      {
        id: "deep_diver",
        title: "Deep Ocean Sip",
        desc: "Log an individual dynamic intake session of 500ml or more.",
        icon: "🐳",
        unlocked: maxSingleSip >= 500,
        current: maxSingleSip,
        target: 500,
        unit: "ml",
        color: "#6C63FF",
      },
      {
        id: "aquatic_monarch",
        title: "10K Reservist",
        desc: "Pass a combined historic lifetime vault volume of 10,000ml.",
        icon: "👑",
        unlocked: totalVolume >= 10000,
        current: totalVolume,
        target: 10000,
        unit: "ml",
        color: "#F5A623",
      },
      {
        id: "dawn_patrol",
        title: "Dawn Patrol",
        desc: "Kickstart metabolism early by logging 3 drinks before 9:00 AM.",
        icon: "🌅",
        unlocked: morningSips >= 3,
        current: morningSips,
        target: 3,
        unit: "sips",
        color: "#FCD34D",
      },
      {
        id: "night_owl",
        title: "Nocturnal Guard",
        desc: "Prevent overnight dehydration by logging 3 sips after 9:00 PM.",
        icon: "🦉",
        unlocked: nightSips >= 3,
        current: nightSips,
        target: 3,
        unit: "sips",
        color: "#A78BFA",
      },
      {
        id: "habit_master",
        title: "Atomic Habit",
        desc: "Build continuous tactical tracking muscle by making 25 total entries.",
        icon: "⚡",
        unlocked: totalEntriesCount >= 25,
        current: totalEntriesCount,
        target: 25,
        unit: "logs",
        color: "#00FF87",
      },
      {
        id: "perfect_week",
        title: "Legendary Week",
        desc: "Lock down absolute execution by hitting your goal 7 unique times.",
        icon: "🛡️",
        unlocked: totalDaysHit >= 7,
        current: totalDaysHit,
        target: 7,
        unit: "days",
        color: "#38BDF8",
      },
      {
        id: "weekend_warrior",
        title: "Weekend Warrior",
        desc: "Defeat relaxed weekend habits by hitting your goal 2 times on Saturday or Sunday.",
        icon: "🏄",
        unlocked: weekendHits >= 2,
        current: weekendHits,
        target: 2,
        unit: "days",
        color: "#FB7185",
      },
      {
        id: "caffeine_shield",
        title: "Counter-Balance",
        desc: "Log an alternative mix profile to safely offset custom metrics.",
        icon: "☕",
        unlocked: totalVolume > 0,
        current: totalVolume > 0 ? 1 : 0,
        target: 1,
        unit: "mix",
        color: "#C084FC",
      },
      {
        id: "immortal_aquanaut",
        title: "Elite Aquanaut",
        desc: "Reach an absolute pinnacle history total volume of 50,000ml.",
        icon: "🌌",
        unlocked: totalVolume >= 50000,
        current: totalVolume,
        target: 50000,
        unit: "ml",
        color: "#EC4899",
      }
    ];

    // Compute status flags dynamically for the final 12th Master Rank badge
    const coreUnlockedCount = baseBadges.filter(b => b.unlocked).length;
    
    return [
      ...baseBadges,
      {
        id: "grandmaster_vault",
        title: "Hydro Grandmaster",
        desc: "Achieve the absolute apex completion status by unlocking any 6 base badges.",
        icon: "💎",
        unlocked: coreUnlockedCount >= 6,
        current: coreUnlockedCount,
        target: 6,
        unit: "badges",
        color: "#22C55E",
      }
    ];
  }, [logs, streaks.best, goal]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-6 pb-28">
      <div className="pt-1">
        <h2 className="text-2xl font-black text-white">Analytics</h2>
        <p className="text-xs text-[#8CA3B5] mt-0.5">Last 7 days overview</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Activity />} label="Avg Daily" value={`${avgIntake} ml`} accent="#00E5CC" />
        <StatCard icon={<Target />} label="Goals Hit" value={`${goalsHit}/7`} accent="#6C63FF" />
        <StatCard icon={<Flame />} label="Streak" value={`${streaks.current}d`} accent="#F5A623" />
        <StatCard icon={<Award />} label="Best Streak" value={`${streaks.best}d`} accent="#ec4899" />
      </div>

      {/* Weekly Intake Chart */}
      <div className="rounded-2xl p-5 bg-[#111827] border border-white/5">
        <p className="text-white font-semibold text-sm mb-4">Weekly Intake</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={28}>
            <XAxis dataKey="day" stroke="#8CA3B5" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#8CA3B5" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip cursor={{ fill: "rgba(0,229,204,0.04)" }} content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-xl p-3 bg-[#1A2F3D] border border-[rgba(0,229,204,0.2)] text-xs">
                  <p className="text-[#8CA3B5]">{label}</p>
                  <p className="text-white font-bold">{payload[0].value} ml</p>
                </div>
              );
            }} />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.hit ? "url(#barHit)" : "rgba(138,163,181,0.2)"} />
              ))}
            </Bar>
            <defs>
              <linearGradient id="barHit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5CC" /><stop offset="100%" stopColor="#6C63FF" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 🏅 THE 12-BADGE TROPHY ROOM GALLERY */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#8CA3B5] text-[11px] font-semibold uppercase tracking-wider">Trophy Room</p>
            <p className="text-[10px] text-[#8CA3B5]/60 mt-0.5">Complete tracking achievements to level up rank</p>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-[#1A2F3D] border border-white/5 text-[11px] font-extrabold text-[#00E5CC]">
            {unlockedCount} / {achievements.length} Unlocked
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {achievements.map((badge) => {
            const progressPct = Math.min((badge.current / badge.target) * 100, 100);

            return (
              <div
                key={badge.id}
                className="relative p-4 rounded-2xl flex flex-col gap-3 border transition-all duration-300 overflow-hidden"
                style={{
                  background: badge.unlocked ? "#111827" : "rgba(26,47,61,0.15)",
                  borderColor: badge.unlocked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                }}
              >
                {/* Visual Glow Aura */}
                {badge.unlocked && (
                  <div 
                    className="absolute pointer-events-none w-24 h-24 rounded-full opacity-[0.05] filter blur-xl -left-4 -top-4"
                    style={{ backgroundColor: badge.color }}
                  />
                )}

                <div className="flex items-start gap-4">
                  {/* Circular Badge Ring */}
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border transition-all"
                    style={{
                      background: badge.unlocked ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)",
                      borderColor: badge.unlocked ? `${badge.color}35` : "rgba(255,255,255,0.02)",
                      filter: badge.unlocked ? "none" : "grayscale(100%) opacity(25%)",
                      boxShadow: badge.unlocked ? `0 0 14px ${badge.color}15` : "none"
                    }}
                  >
                    {badge.icon}
                  </div>

                  {/* Text Details Area */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm text-white" style={{ opacity: badge.unlocked ? 1 : 0.4 }}>
                        {badge.title}
                      </p>
                      <span 
                        className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider"
                        style={{
                          background: badge.unlocked ? `${badge.color}15` : "rgba(138,163,181,0.06)",
                          color: badge.unlocked ? badge.color : "#8CA3B5",
                        }}
                      >
                        {badge.unlocked ? "Unlocked" : "In Progress"}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 text-[#8CA3B5]" style={{ opacity: badge.unlocked ? 1 : 0.35 }}>
                      {badge.desc}
                    </p>
                  </div>
                </div>

                {/* 📊 Progress Metric Tracking Slider Slider */}
                <div className="mt-1 w-full">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-[#8CA3B5]/40">Tracker</span>
                    <span className="font-bold text-white/60">
                      {Math.round(badge.current).toLocaleString()} / {badge.target.toLocaleString()} {badge.unit}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#1A2F3D]/40 overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full"
                      style={{ backgroundColor: badge.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}