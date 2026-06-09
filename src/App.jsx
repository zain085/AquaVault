import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Droplets, BarChart2, CalendarDays, Settings } from "lucide-react";

// Components
import Onboarding from "./components/Onboarding";
import HomeView from "./components/HomeView";
import StatsView from "./components/StatsView";
import CalendarView from "./components/CalendarView";
import SettingsView from "./components/SettingsView";

// Core Utility Calculations
const calcGoal = (p) => {
  if (!p) return 2500;
  let base = (p.weight || 70) * 33;
  if (p.activity === "high") base *= 1.3;
  else if (p.activity === "mod") base *= 1.15;
  if (p.climate === "hot") base *= 1.2;
  return Math.round(base / 100) * 100;
};

const todayStr = () => new Date().toISOString().split("T")[0];
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
};
const motivation = (pct) => {
  if (pct >= 100) return "Vault sealed. Goal crushed.";
  if (pct >= 75) return "Almost at capacity — push through.";
  if (pct >= 50) return "Halfway there. Stay the course.";
  if (pct >= 25) return "Good start. Keep the flow going.";
  return "Open the vault. Start hydrating.";
};

// LocalStorage Hydration Layer
const initState = () => ({ profile: null, logs: [], reminders: { enabled: true, interval: 60 } });
const loadState = () => {
  try {
    const s = localStorage.getItem("aqv_v1");
    return s ? JSON.parse(s) : initState();
  } catch { return initState(); }
};

// Shared Navigation Bar Component
function NavBar({ active, setActive }) {
  const tabs = [
    { id: "home", Icon: Droplets, label: "Home" },
    { id: "stats", Icon: BarChart2, label: "Stats" },
    { id: "calendar", Icon: CalendarDays, label: "Calendar" },
    { id: "settings", Icon: Settings, label: "Settings" },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-[rgba(10,11,15,0.92)] backdrop-blur-xl border-white/5">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-around">
        {tabs.map(({ id, Icon, label }) => (
          <button key={id} onClick={() => setActive(id)} className="flex flex-col items-center gap-1 px-4 transition-all">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={active === id ? { background: "rgba(0,229,204,0.15)", boxShadow: "0 0 12px rgba(0,229,204,0.2)" } : {}}>
              <Icon size={20} style={{ color: active === id ? "#00E5CC" : "#8CA3B5" }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: active === id ? "#00E5CC" : "#8CA3B5" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(loadState);
  const [view, setView] = useState("home");
  const [toast, setToast] = useState(null);
  const [celebration, setCelebration] = useState(false);
  
  // 📈 Real-time dynamic Level-Up State Overlay Channel
  const [levelUpData, setLevelUpData] = useState(null);

  useEffect(() => {
    if (!data.profile) return;
    try { localStorage.setItem("aqv_v1", JSON.stringify(data)); } catch {}
  }, [data]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const addWater = useCallback((amount) => {
    const today = todayStr();
    const entry = { id: `${today}-${Date.now()}`, amount, timestamp: new Date().toISOString() };
    
    setData((prev) => {
      const logs = [...prev.logs];
      const idx = logs.findIndex((l) => l.date === today);
      
      // Calculate volumes before insertion to map exact XP progression milestones
      const prevHistoryVol = prev.logs.reduce((sum, l) => sum + l.total, 0);
      const prevTotal = idx >= 0 ? logs[idx].total : 0;
      const newTotal = prevTotal + amount;
      
      if (idx >= 0) {
        logs[idx] = { ...logs[idx], entries: [...logs[idx].entries, entry], total: newTotal };
      } else {
        logs.push({ date: today, entries: [entry], total: amount });
      }
      
      const nextHistoryVol = prevHistoryVol + amount;
      const prevLevel = Math.floor(prevHistoryVol / 1000) + 1;
      const nextLevel = Math.floor(nextHistoryVol / 1000) + 1;

      // Trigger high-priority visual level up modal sequence if crossing 1000ml brackets
      if (nextLevel > prevLevel) {
        setTimeout(() => {
          setLevelUpData({ level: nextLevel, xp: nextLevel * 1000 });
        }, 400);
      }

      // Check daily goal celebration criteria
      if (newTotal >= prev.profile.dailyGoal && prevTotal < prev.profile.dailyGoal) {
        setCelebration(true);
        setTimeout(() => setCelebration(false), 3000);
      }
      
      return { ...prev, logs };
    });
    
    showToast(`+${amount} ml added`);
  }, []);

  const deleteWater = useCallback((id, amount) => {
    const today = todayStr();
    setData((prev) => {
      const logs = [...prev.logs];
      const idx = logs.findIndex((l) => l.date === today);
      if (idx >= 0) {
        logs[idx] = { ...logs[idx], entries: logs[idx].entries.filter((e) => e.id !== id), total: Math.max(logs[idx].total - amount, 0) };
      }
      return { ...prev, logs };
    });
    showToast(`−${amount} ml removed`);
  }, []);

  if (!data.profile) return <Onboarding onComplete={(profile) => setData({ profile, logs: [], reminders: { enabled: true, interval: 60 } })} calcGoal={calcGoal} />;

  return (
    <div className="min-h-screen relative bg-[#0A0B0F]">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 filter blur-[60px]" style={{ background: "radial-gradient(circle, #00E5CC 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15 filter blur-[80px]" style={{ background: "radial-gradient(circle, #6C63FF 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-5 pt-6">
        <AnimatePresence mode="wait">
          {view === "home" && (
            <HomeView 
              key="home" 
              data={data} 
              addWater={addWater} 
              deleteWater={deleteWater} 
              greeting={greeting} 
              motivation={motivation} 
              todayStr={todayStr} 
              setView={setView} 
            />
          )}
          {view === "stats" && <StatsView key="stats" data={data} />}
          {view === "calendar" && <CalendarView key="calendar" data={data} todayStr={todayStr} />}
          {view === "settings" && <SettingsView key="settings" data={data} setData={setData} calcGoal={calcGoal} />}
        </AnimatePresence>
      </div>

      <NavBar active={view} setActive={setView} />

      {/* Notifications and Celebration Overlays */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -60, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -60, scale: 0.9 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-semibold text-sm bg-gradient-to-r from-[#00E5CC] to-[#00B8A6] text-[#0A0B0F] shadow-[0_0_24px_rgba(0,229,204,0.3)]">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {celebration && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <motion.div animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1, 1.2, 1] }} transition={{ repeat: 2, duration: 0.5 }} className="text-7xl mb-4">💧</motion.div>
              <h2 className="text-3xl font-black text-[#00E5CC]">Vault Sealed!</h2>
              <p className="text-white/60 mt-2 text-sm">You hit your daily target.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔮 LEVEL UP INTERACTIVE OVERLAY MODAL BANNER */}
      <AnimatePresence>
        {levelUpData && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 40 }}
              className="w-full max-w-xs rounded-3xl p-6 text-center bg-[#111827] border border-[#00E5CC]/30 shadow-[0_0_40px_rgba(0,229,204,0.15)] relative overflow-hidden"
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#6C63FF]/20 rounded-full blur-xl pointer-events-none" />

              <div className="w-16 h-16 bg-gradient-to-br from-[#00E5CC] to-[#6C63FF] rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg shadow-[#00E5CC]/20 animate-bounce mb-4">
                👑
              </div>
              
              <p className="text-[10px] uppercase font-black tracking-widest text-[#00E5CC]">Rank Promotion</p>
              <h3 className="text-2xl font-black text-white mt-1">Level {levelUpData.level} Reached</h3>
              <p className="text-xs text-[#8CA3B5] mt-1.5 px-2">
                Your global storage capacity has expanded! Keep collecting badges to lock down elite status.
              </p>

              <div className="my-4 bg-[#1A2F3D]/50 border border-white/5 p-2.5 rounded-xl text-left">
                <div className="flex justify-between text-[10px] text-[#8CA3B5] font-semibold">
                  <span>Next Milestone</span>
                  <span>{levelUpData.xp} / {levelUpData.xp + 1000} XP</span>
                </div>
                <div className="h-1.5 bg-[#0A0B0F] rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#00E5CC] to-[#6C63FF] w-1/4" />
                </div>
              </div>

              <button 
                onClick={() => setLevelUpData(null)}
                className="w-full py-3 rounded-xl font-bold bg-white text-[#0A0B0F] shadow-md active:scale-95 transition-transform text-xs"
              >
                Claim Vault Rewards
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}