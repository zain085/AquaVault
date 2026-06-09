import React from "react";
import { motion } from "framer-motion";

export default function CalendarView({ data, todayStr }) {
  const { logs, profile } = data;
  const goal = profile?.dailyGoal || 2500;
  const today = todayStr();
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  
  for (let d = 1; d <= daysInMonth; d++) {
    // 🛠️ FIX: Formats the date string manually without converting timezones
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const date = `${year}-${mm}-${dd}`;

    const log = logs.find((l) => l.date === date);
    cells.push({
      day: d,
      date,
      total: log?.total || 0,
      achieved: log ? log.total >= goal : false,
      partial: log && log.total > 0 && log.total < goal,
      isToday: date === today,
    });
  }

  const achieved = cells.filter((c) => c?.achieved).length;
  const tracked = cells.filter((c) => c?.total > 0).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-6 pb-28">
      <div className="pt-1">
        <h2 className="text-2xl font-black text-white">Calendar</h2>
        <p className="text-xs text-[#8CA3B5] mt-0.5">{now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 bg-[#111827] border border-white/5">
          <p className="text-[#8CA3B5] text-[11px] mb-1">Goals reached</p>
          <p className="text-white font-extrabold text-xl">{achieved} days</p>
        </div>
        <div className="rounded-2xl p-4 bg-[#111827] border border-white/5">
          <p className="text-[#8CA3B5] text-[11px] mb-1">Days tracked</p>
          <p className="text-white font-extrabold text-xl">{tracked} days</p>
        </div>
      </div>

      <div className="rounded-2xl p-4 bg-[#111827] border border-white/5">
        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-[#8CA3B5]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell, i) => (
            <motion.div
              key={i} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.008 }}
              className="aspect-square rounded-xl flex items-center justify-center text-xs"
              style={
                !cell ? {} : cell.achieved
                  ? { background: "linear-gradient(135deg,#00E5CC,#6C63FF)", color: "#fff", boxShadow: "0 0 8px rgba(0,229,204,0.3)", fontWeight: 600 }
                  : cell.partial
                    ? { background: "rgba(0,229,204,0.12)", color: "#00E5CC", border: "1px solid rgba(0,229,204,0.2)", fontWeight: 600 }
                    : cell.isToday
                      ? { background: "rgba(108,99,255,0.15)", color: "#6C63FF", border: "1px solid rgba(108,99,255,0.4)", fontWeight: 600 }
                      : { background: "#1A2F3D", color: "#8CA3B5", fontWeight: 500 }
              }
            >
              {cell?.day}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {[
          { color: "linear-gradient(135deg,#00E5CC,#6C63FF)", label: "Goal hit" },
          { color: "rgba(0,229,204,0.12)", border: "1px solid rgba(0,229,204,0.2)", label: "Partial" },
          { color: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.4)", label: "Today" },
        ].map(({ color, border, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: color, border }} />
            <span className="text-[#8CA3B5] text-xs">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}