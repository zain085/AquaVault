import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets } from "lucide-react";

export default function Onboarding({ onComplete, calcGoal }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", weight: 70, activity: "", climate: "" });

  const steps = [
    {
      title: "What should we call you?",
      sub: "Your personal hydration vault starts here.",
      content: (
        <input
          autoFocus
          type="text"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Your name"
          className="w-full p-4 text-lg rounded-2xl font-medium outline-none text-white bg-[#1A2F3D]"
          style={{ border: "1px solid rgba(0,229,204,0.2)" }}
        />
      ),
      valid: () => form.name.trim().length > 0,
    },
    {
      title: "Your weight?",
      sub: "Used to calculate your ideal daily intake.",
      content: (
        <div className="space-y-3">
          <input
            type="number"
            value={form.weight || ""}
            onChange={(e) => {
              const val = e.target.value;
              setForm((p) => ({ ...p, weight: val === "" ? "" : parseInt(val) }));
            }}
            className="w-full p-4 text-lg rounded-2xl font-medium outline-none text-white bg-[#1A2F3D]"
            style={{ border: "1px solid rgba(0,229,204,0.2)" }}
          />
          <p className="text-center text-xs text-[#8CA3B5]">kilograms</p>
        </div>
      ),
      valid: () => form.weight >= 30 && form.weight <= 300,
    },
    {
      title: "How active are you?",
      sub: "Activity increases your hydration needs.",
      content: (
        <div className="space-y-2">
          {[
            { id: "low", label: "Low", desc: "Desk job, mostly sitting" },
            { id: "mod", label: "Moderate", desc: "Light exercise a few days/week" },
            { id: "high", label: "High", desc: "Intense training most days" },
          ].map((o) => (
            <button
              key={o.id}
              onClick={() => setForm((p) => ({ ...p, activity: o.id }))}
              className="w-full p-4 rounded-2xl text-left transition-all"
              style={{
                background: form.activity === o.id ? "rgba(0,229,204,0.12)" : "#1A2F3D",
                border: `1px solid ${form.activity === o.id ? "#00E5CC" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <div className="fontWeight-600" style={{ color: form.activity === o.id ? "#00E5CC" : "#fff" }}>
                {o.label}
              </div>
              <div className="text-xs text-[#8CA3B5] mt-0.5">{o.desc}</div>
            </button>
          ))}
        </div>
      ),
      valid: () => form.activity !== "",
    },
    {
      title: "Your climate?",
      sub: "Heat and humidity raise your fluid needs.",
      content: (
        <div className="space-y-2">
          {[
            { id: "cool", label: "Cool", emoji: "❄️", desc: "Cold or mild temperatures" },
            { id: "mod", label: "Moderate", emoji: "🌤️", desc: "Comfortable year-round" },
            { id: "hot", label: "Hot", emoji: "☀️", desc: "Hot or humid environment" },
          ].map((o) => (
            <button
              key={o.id}
              onClick={() => setForm((p) => ({ ...p, climate: o.id }))}
              className="w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4"
              style={{
                background: form.climate === o.id ? "rgba(0,229,204,0.12)" : "#1A2F3D",
                border: `1px solid ${form.climate === o.id ? "#00E5CC" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <span className="text-2xl">{o.emoji}</span>
              <div>
                <div className="fontWeight-600" style={{ color: form.climate === o.id ? "#00E5CC" : "#fff" }}>
                  {o.label}
                </div>
                <div className="text-xs text-[#8CA3B5]">{o.desc}</div>
              </div>
            </button>
          ))}
        </div>
      ),
      valid: () => form.climate !== "",
    },
  ];

  const cur = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (!cur.valid()) return;
    if (isLast) {
      const profile = { ...form, dailyGoal: calcGoal(form) };
      onComplete(profile);
    } else setStep((s) => s + 1);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 pb-12 bg-[#0A0B0F]">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-[rgba(0,229,204,0.12)] border border-[rgba(0,229,204,0.3)] shadow-[0_0_24px_rgba(0,229,204,0.25)]">
          <Droplets size={32} className="text-[#00E5CC]" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00E5CC] to-[#6C63FF]">
          AquaVault
        </h1>
        <p className="text-xs text-[#8CA3B5] mt-1">Secure your hydration level, maintain perfect streaks, and unlock rare badges.</p>
      </div>

      <div className="flex gap-2 justify-center mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className="height-1 rounded-full transition-all duration-300"
            style={{ height: 4, width: i === step ? 28 : 12, background: i <= step ? "#00E5CC" : "#1A2F3D" }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="space-y-5"
        >
          <div>
            <h2 className="text-xl font-extrabold text-white">{cur.title}</h2>
            <p className="text-xs text-[#8CA3B5] mt-1">{cur.sub}</p>
          </div>
          {cur.content}
        </motion.div>
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleNext}
        disabled={!cur.valid()}
        className="w-full mt-8 p-4 rounded-2xl font-bold text-base transition-all"
        style={
          cur.valid()
            ? { background: "linear-gradient(135deg,#00E5CC,#00B8A6)", color: "#0A0B0F", boxShadow: "0 0 24px rgba(0,229,204,0.3)" }
            : { background: "#1A2F3D", color: "#8CA3B5", cursor: "not-allowed" }
        }
      >
        {isLast ? "Open the Vault" : "Continue"}
      </motion.button>
    </div>
  );
}