import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, ChevronRight, Bell, Trash2, X } from "lucide-react";

export default function SettingsView({ data, setData, calcGoal }) {
  const { profile, reminders } = data;
  const goal = profile?.dailyGoal || 2500;
  const [showCalc, setShowCalc] = useState(false);
  const [calcForm, setCalcForm] = useState({
    weight: profile?.weight || 70,
    activity: profile?.activity || "mod",
    climate: profile?.climate || "mod",
  });
  const recommended = calcGoal(calcForm);

  const saveGoal = () => {
    setData((p) => ({
      ...p,
      profile: { ...p.profile, ...calcForm, dailyGoal: recommended },
    }));
    setShowCalc(false);
  };

  const resetAll = () => {
    if (window.confirm("Reset all data and restart onboarding?")) {
      localStorage.removeItem("aqv_v1");
      window.location.reload();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-5 pb-28">
      <div className="pt-1">
        <h2 className="text-2xl font-black text-white">Settings</h2>
        <p className="text-xs text-[#8CA3B5] mt-0.5">Customize your AquaVault</p>
      </div>

      <div className="rounded-2xl p-5 bg-[#111827] border border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black bg-[rgba(0,229,204,0.12)] text-[#00E5CC]">
            {profile?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-white font-bold">{profile?.name}</p>
            <p className="text-xs text-[#8CA3B5] mt-0.5">
              {profile?.weight} kg · {profile?.activity} activity · {profile?.climate} climate
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-[#111827] border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold">Daily Goal</p>
          <Target size={18} className="text-[#00E5CC]" />
        </div>
        <p className="text-3xl font-black text-[#00E5CC]">{goal} ml</p>
        <p className="text-xs text-[#8CA3B5] mt-1 mb-4">Your current daily target</p>
        <button onClick={() => setShowCalc(true)} className="flex items-center gap-2 text-[#00E5CC] text-sm font-semibold">
          Recalculate <ChevronRight size={14} />
        </button>
      </div>

      <div className="rounded-2xl p-5 bg-[#111827] border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-[#6C63FF]" />
            <p className="text-white font-semibold">Reminders</p>
          </div>
          <button
            onClick={() => setData((p) => ({ ...p, reminders: { ...p.reminders, enabled: !p.reminders.enabled } }))}
            className="relative w-12 h-6 rounded-full transition-all" style={{ background: reminders.enabled ? "#00E5CC" : "#1A2F3D" }}
          >
            <motion.div animate={{ x: reminders.enabled ? 24 : 2 }} className="w-5 h-5 rounded-full bg-white absolute top-0.5" />
          </button>
        </div>
        {reminders.enabled && (
          <div>
            <label className="text-[#8CA3B5] text-[11px] block mb-1.5">Interval (minutes)</label>
            <input
              type="number" min="15" max="240" value={reminders.interval}
              onChange={(e) => setData((p) => ({ ...p, reminders: { ...p.reminders, interval: parseInt(e.target.value) || 60 } }))}
              className="w-full p-3 rounded-xl outline-none text-white bg-[#1A2F3D] border border-white/5"
            />
          </div>
        )}
      </div>

      <button onClick={resetAll} className="w-full p-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
        <Trash2 size={16} /> Reset All Data
      </button>

      <AnimatePresence>
        {showCalc && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCalc(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl p-6 space-y-4 overflow-y-auto max-h-[80vh] bg-[#111827] border border-[rgba(0,229,204,0.15)]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-white">Recalculate Goal</h3>
                <button onClick={() => setShowCalc(false)} className="text-[#8CA3B5]"><X size={20} /></button>
              </div>
              <div>
                <label className="text-[#8CA3B5] text-[11px] block mb-1.5">Weight (kg)</label>
                <input
                  type="number" value={calcForm.weight}
                  onChange={(e) => setCalcForm((p) => ({ ...p, weight: parseInt(e.target.value) || 70 }))}
                  className="w-full p-3 rounded-xl outline-none text-white bg-[#1A2F3D] border border-white/5"
                />
              </div>
              <div>
                <label className="text-[#8CA3B5] text-[11px] block mb-1.5">Activity Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {["low", "mod", "high"].map((l) => (
                    <button
                      key={l} onClick={() => setCalcForm((p) => ({ ...p, activity: l }))}
                      className="p-2.5 rounded-xl text-sm font-medium transition-all"
                      style={calcForm.activity === l ? { background: "#00E5CC", color: "#0A0B0F" } : { background: "#1A2F3D", color: "#8CA3B5" }}
                    >
                      {l === "mod" ? "Mod" : l.charAt(0).toUpperCase() + l.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[#8CA3B5] text-[11px] block mb-1.5">Climate</label>
                <div className="grid grid-cols-3 gap-2">
                  {["cool", "mod", "hot"].map((c) => (
                    <button
                      key={c} onClick={() => setCalcForm((p) => ({ ...p, climate: c }))}
                      className="p-2.5 rounded-xl text-sm font-medium transition-all"
                      style={calcForm.climate === c ? { background: "#00E5CC", color: "#0A0B0F" } : { background: "#1A2F3D", color: "#8CA3B5" }}
                    >
                      {c === "mod" ? "Mod" : c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-4 bg-[rgba(0,229,204,0.06)] border border-[rgba(0,229,204,0.2)]">
                <p className="text-[#8CA3B5] text-[11px] mb-1">Recommended Daily Goal</p>
                <p className="text-3xl font-black text-[#00E5CC]">{recommended} ml</p>
              </div>
              <button onClick={saveGoal} className="w-full p-4 rounded-2xl font-bold bg-gradient-to-r from-[#00E5CC] to-[#00B8A6] text-[#0A0B0F]">Save Goal</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}