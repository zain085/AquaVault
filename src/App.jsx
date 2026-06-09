import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Droplets, Flame, Trophy, BarChart2, CalendarDays, Settings, Plus, X, ChevronRight, Target, Zap, Activity, Award, Bell, Trash2 } from 'lucide-react';

const calcGoal = (p) => {
  if (!p) return 2500;
  let base = (p.weight || 70) * 33;
  if (p.activity === 'high') base *= 1.3;
  else if (p.activity === 'mod') base *= 1.15;
  if (p.climate === 'hot') base *= 1.2;
  return Math.round(base / 100) * 100;
};

const todayStr = () => new Date().toISOString().split('T')[0];

const genSampleLogs = (goal = 2500) => {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (13 - i));
    const date = d.toISOString().split('T')[0];
    const count = Math.floor(Math.random() * 8) + 3;
    const entries = Array.from({ length: count }, (_, j) => {
      const amt = [100, 150, 250, 350, 500][Math.floor(Math.random() * 5)];
      const h = 7 + Math.floor(Math.random() * 14);
      const m = Math.floor(Math.random() * 60);
      const ts = new Date(d); ts.setHours(h, m, 0, 0);
      return { id: `${date}-${j}`, amount: amt, timestamp: ts.toISOString() };
    });
    return { date, entries, total: entries.reduce((s, e) => s + e.amount, 0) };
  });
};

const initState = () => ({ profile: null, logs: [], reminders: { enabled: true, interval: 60 } });
const loadState = () => {
  try { const s = localStorage.getItem('aqv_v1'); return s ? JSON.parse(s) : initState(); }
  catch { return initState(); }
};
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning'; if (h < 18) return 'Good Afternoon'; return 'Good Evening';
};
const motivation = (pct) => {
  if (pct >= 100) return 'Vault sealed. Goal crushed.';
  if (pct >= 75) return 'Almost at capacity — push through.';
  if (pct >= 50) return 'Halfway there. Stay the course.';
  if (pct >= 25) return 'Good start. Keep the flow going.';
  return 'Open the vault. Start hydrating.';
};

function LiquidRing({ pct }) {
  const r = 96, cx = 112, cy = 112;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <div className="relative flex items-center justify-center" style={{ width: 224, height: 224 }}>
      <div className="absolute rounded-full" style={{ width: 180, height: 180, background: `radial-gradient(circle, rgba(0,229,204,${Math.min(pct,100)*0.003+0.04}) 0%, transparent 70%)` }} />
      <svg width={224} height={224} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ringG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5CC" /><stop offset="100%" stopColor="#6C63FF" />
          </linearGradient>
          <filter id="blur2"><feGaussianBlur stdDeviation="2.5" /></filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1A2F3D" strokeWidth={14} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#ringG)" strokeWidth={10} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} filter="url(#blur2)" opacity={0.35} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#ringG)" strokeWidth={14} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span style={{ fontSize: 11, color: '#8CA3B5', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Today</span>
        <span style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg,#00E5CC,#6C63FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {Math.round(pct)}%
        </span>
        <span id="ring-ml" style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 15 }} />
      </div>
    </div>
  );
}

function Bubble({ x, y, size }) {
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: 'radial-gradient(circle at 35% 35%, rgba(0,229,204,0.6), rgba(0,229,204,0.1))', border: '1px solid rgba(0,229,204,0.3)' }}
      initial={{ opacity: 0.7, y: 0, scale: 1 }} animate={{ opacity: 0, y: -80, scale: 0.1 }} transition={{ duration: 1.4, ease: 'easeOut' }}
    />
  );
}

function Toast({ msg }) {
  return (
    <motion.div initial={{ opacity: 0, y: -60, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -60, scale: 0.9 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-semibold text-sm"
      style={{ background: 'linear-gradient(135deg,#00E5CC,#00B8A6)', color: '#0A0B0F', boxShadow: '0 0 24px rgba(0,229,204,0.3)' }}>
      {msg}
    </motion.div>
  );
}

function NavBar({ active, setActive }) {
  const tabs = [
    { id: 'home', Icon: Droplets, label: 'Home' },
    { id: 'stats', Icon: BarChart2, label: 'Stats' },
    { id: 'calendar', Icon: CalendarDays, label: 'Calendar' },
    { id: 'settings', Icon: Settings, label: 'Settings' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t" style={{ background: 'rgba(10,11,15,0.92)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-around">
        {tabs.map(({ id, Icon, label }) => (
          <button key={id} onClick={() => setActive(id)} className="flex flex-col items-center gap-1 px-4 transition-all">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={active === id ? { background: 'rgba(0,229,204,0.15)', boxShadow: '0 0 12px rgba(0,229,204,0.2)' } : {}}>
              <Icon size={20} style={{ color: active === id ? '#00E5CC' : '#8CA3B5' }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: active === id ? '#00E5CC' : '#8CA3B5' }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', weight: 70, activity: '', climate: '' });
  const steps = [
    {
      title: "What should we call you?", sub: "Your personal hydration vault starts here.",
      content: (
        <input autoFocus type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name"
          className="w-full p-4 text-lg rounded-2xl font-medium outline-none" style={{ background: '#1A2F3D', border: '1px solid rgba(0,229,204,0.2)', color: '#fff' }} />
      ),
      valid: () => form.name.trim().length > 0,
    },
    {
      title: "Your weight?", sub: "Used to calculate your ideal daily intake.",
      content: (
        <div className="space-y-3">
          <input type="number" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: parseInt(e.target.value) || 50 }))}
            className="w-full p-4 text-lg rounded-2xl font-medium outline-none" style={{ background: '#1A2F3D', border: '1px solid rgba(0,229,204,0.2)', color: '#fff' }} />
          <p className="text-center" style={{ color: '#8CA3B5', fontSize: 13 }}>kilograms</p>
        </div>
      ),
      valid: () => form.weight >= 30 && form.weight <= 300,
    },
    {
      title: "How active are you?", sub: "Activity increases your hydration needs.",
      content: (
        <div className="space-y-2">
          {[{ id: 'low', label: 'Low', desc: 'Desk job, mostly sitting' }, { id: 'mod', label: 'Moderate', desc: 'Light exercise a few days/week' }, { id: 'high', label: 'High', desc: 'Intense training most days' }].map(o => (
            <button key={o.id} onClick={() => setForm(p => ({ ...p, activity: o.id }))} className="w-full p-4 rounded-2xl text-left transition-all"
              style={{ background: form.activity === o.id ? 'rgba(0,229,204,0.12)' : '#1A2F3D', border: `1px solid ${form.activity === o.id ? '#00E5CC' : 'rgba(255,255,255,0.06)'}` }}>
              <div style={{ fontWeight: 600, color: form.activity === o.id ? '#00E5CC' : '#fff' }}>{o.label}</div>
              <div style={{ fontSize: 13, color: '#8CA3B5', marginTop: 2 }}>{o.desc}</div>
            </button>
          ))}
        </div>
      ),
      valid: () => form.activity !== '',
    },
    {
      title: "Your climate?", sub: "Heat and humidity raise your fluid needs.",
      content: (
        <div className="space-y-2">
          {[{ id: 'cool', label: 'Cool', emoji: '❄️', desc: 'Cold or mild temperatures' }, { id: 'mod', label: 'Moderate', emoji: '🌤️', desc: 'Comfortable year-round' }, { id: 'hot', label: 'Hot', emoji: '☀️', desc: 'Hot or humid environment' }].map(o => (
            <button key={o.id} onClick={() => setForm(p => ({ ...p, climate: o.id }))} className="w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4"
              style={{ background: form.climate === o.id ? 'rgba(0,229,204,0.12)' : '#1A2F3D', border: `1px solid ${form.climate === o.id ? '#00E5CC' : 'rgba(255,255,255,0.06)'}` }}>
              <span style={{ fontSize: 24 }}>{o.emoji}</span>
              <div>
                <div style={{ fontWeight: 600, color: form.climate === o.id ? '#00E5CC' : '#fff' }}>{o.label}</div>
                <div style={{ fontSize: 13, color: '#8CA3B5' }}>{o.desc}</div>
              </div>
            </button>
          ))}
        </div>
      ),
      valid: () => form.climate !== '',
    },
  ];
  const cur = steps[step];
  const isLast = step === steps.length - 1;
  const handleNext = () => {
    if (!cur.valid()) return;
    if (isLast) { const profile = { ...form, dailyGoal: calcGoal(form) }; onComplete(profile); }
    else setStep(s => s + 1);
  };
  return (
    <div className="min-h-screen flex flex-col justify-center px-6 pb-12" style={{ background: '#0A0B0F' }}>
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'rgba(0,229,204,0.12)', border: '1px solid rgba(0,229,204,0.3)', boxShadow: '0 0 24px rgba(0,229,204,0.25)' }}>
          <Droplets size={32} style={{ color: '#00E5CC' }} />
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em', background: 'linear-gradient(135deg,#00E5CC,#6C63FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AquaVault</h1>
        <p style={{ color: '#8CA3B5', fontSize: 13, marginTop: 4 }}>Precision hydration tracking</p>
      </div>
      <div className="flex gap-2 justify-center mb-8">
        {steps.map((_, i) => <div key={i} className="rounded-full transition-all duration-300" style={{ height: 4, width: i === step ? 28 : 12, background: i <= step ? '#00E5CC' : '#1A2F3D' }} />)}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{cur.title}</h2>
            <p style={{ color: '#8CA3B5', fontSize: 13, marginTop: 4 }}>{cur.sub}</p>
          </div>
          {cur.content}
        </motion.div>
      </AnimatePresence>
      <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext} disabled={!cur.valid()}
        className="w-full mt-8 p-4 rounded-2xl font-bold text-base transition-all"
        style={cur.valid() ? { background: 'linear-gradient(135deg,#00E5CC,#00B8A6)', color: '#0A0B0F', boxShadow: '0 0 24px rgba(0,229,204,0.3)' } : { background: '#1A2F3D', color: '#8CA3B5', cursor: 'not-allowed' }}>
        {isLast ? 'Open the Vault' : 'Continue'}
      </motion.button>
    </div>
  );
}

function HomeView({ data, addWater, deleteWater }) {
  const { profile, logs } = data;
  const today = todayStr();
  const todayLog = logs.find(l => l.date === today) || { date: today, entries: [], total: 0 };
  const goal = profile?.dailyGoal || 2500;
  const total = todayLog.total;
  const pct = Math.min((total / goal) * 100, 100);
  const remaining = Math.max(goal - total, 0);
  const [bubbles, setBubbles] = useState([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customAmt, setCustomAmt] = useState('');

  useEffect(() => { const el = document.getElementById('ring-ml'); if (el) el.textContent = `${total} ml`; }, [total]);

  const handleAdd = useCallback((amount) => {
    addWater(amount);
    setBubbles(b => [...b.slice(-8), ...Array.from({ length: 5 }, (_, i) => ({ id: Date.now() + i, x: `${20 + Math.random() * 60}%`, y: `${35 + Math.random() * 35}%`, size: 6 + Math.random() * 12 }))]);
  }, [addWater]);

  const handleCustomAdd = () => { const n = parseInt(customAmt); if (n > 0 && n <= 5000) { handleAdd(n); setShowCustom(false); setCustomAmt(''); } };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-6 pb-28">
      <div className="flex items-start justify-between pt-1">
        <div>
          <p style={{ color: '#8CA3B5', fontSize: 13 }}>{greeting()}</p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginTop: 2 }}>{profile?.name || 'Friend'}</h1>
        </div>
        <div className="px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,229,204,0.1)', color: '#00E5CC', border: '1px solid rgba(0,229,204,0.2)', fontSize: 12, fontWeight: 700 }}>
          Goal: {goal} ml
        </div>
      </div>

      <div className="relative flex justify-center">
        {bubbles.map(b => <Bubble key={b.id} {...b} />)}
        <LiquidRing pct={pct} />
      </div>

      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,229,204,0.12)' }}>
          <Zap size={18} style={{ color: '#00E5CC' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{motivation(pct)}</p>
          <p style={{ color: '#8CA3B5', fontSize: 12, marginTop: 2 }}>{remaining > 0 ? `${remaining} ml to go` : 'Daily target reached 🎉'}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-2" style={{ fontSize: 12, color: '#8CA3B5' }}>
          <span>Hydration level</span><span>{total} / {goal} ml</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1A2F3D' }}>
          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#00E5CC,#6C63FF)' }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }} />
        </div>
      </div>

      <div>
        <p style={{ color: '#8CA3B5', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Quick Add</p>
        <div className="grid grid-cols-3 gap-3">
          {[{ amount: 100, label: 'Sip', sub: '100 ml' }, { amount: 250, label: 'Cup', sub: '250 ml' }, { amount: 500, label: 'Bottle', sub: '500 ml' }].map(({ amount, label, sub }) => (
            <motion.button key={amount} whileTap={{ scale: 0.93 }} onClick={() => handleAdd(amount)}
              className="rounded-2xl p-4 flex flex-col items-center gap-1.5 transition-all"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Droplets size={22} style={{ color: '#00E5CC' }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{label}</span>
              <span style={{ color: '#8CA3B5', fontSize: 11 }}>{sub}</span>
            </motion.button>
          ))}
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCustom(true)}
          className="w-full mt-3 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
          style={{ background: 'linear-gradient(135deg,#00E5CC,#00B8A6)', color: '#0A0B0F', boxShadow: '0 0 20px rgba(0,229,204,0.2)' }}>
          <Plus size={18} /> Custom Amount
        </motion.button>
      </div>

      {todayLog.entries.length > 0 && (
        <div>
          <p style={{ color: '#8CA3B5', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Today's Log</p>
          <div className="space-y-2">
            {[...todayLog.entries].reverse().slice(0, 6).map(entry => (
              <motion.div key={entry.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,229,204,0.1)' }}>
                    <Droplets size={15} style={{ color: '#00E5CC' }} />
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{entry.amount} ml</p>
                    <p style={{ color: '#8CA3B5', fontSize: 11 }}>{new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                  </div>
                </div>
                <button onClick={() => deleteWater(entry.id, entry.amount)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <X size={14} style={{ color: '#ef4444' }} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCustom && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowCustom(false)}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-3xl p-6"
              style={{ background: '#111827', border: '1px solid rgba(0,229,204,0.15)' }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Custom Amount</h3>
              <input autoFocus type="number" value={customAmt} onChange={e => setCustomAmt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCustomAdd()} placeholder="Amount in ml"
                className="w-full p-4 rounded-2xl text-lg outline-none mb-4" style={{ background: '#1A2F3D', border: '1px solid rgba(0,229,204,0.2)', color: '#fff' }} />
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowCustom(false)} className="p-3 rounded-xl font-medium transition-all" style={{ background: '#1A2F3D', color: '#8CA3B5' }}>Cancel</button>
                <button onClick={handleCustomAdd} className="p-3 rounded-xl font-bold transition-all" style={{ background: 'linear-gradient(135deg,#00E5CC,#00B8A6)', color: '#0A0B0F' }}>Add</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${accent}18` }}>
        {React.cloneElement(icon, { size: 18, style: { color: accent } })}
      </div>
      <p style={{ color: '#8CA3B5', fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>{value}</p>
    </div>
  );
}

function StatsView({ data }) {
  const { logs, profile } = data;
  const goal = profile?.dailyGoal || 2500;
  const last7 = logs.slice(-7);
  const avgIntake = last7.length ? Math.round(last7.reduce((s, l) => s + l.total, 0) / last7.length) : 0;
  const goalsHit = last7.filter(l => l.total >= goal).length;
  const streaks = useMemo(() => {
    const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    let cur = 0;
    for (let i = 0; i < sorted.length; i++) {
      const d = new Date(sorted[i].date); d.setHours(0, 0, 0, 0);
      const exp = new Date(todayDate); exp.setDate(todayDate.getDate() - i);
      if (d.getTime() !== exp.getTime()) break;
      if (sorted[i].total >= goal) cur++; else break;
    }
    let best = 0, tmp = 0;
    for (const l of [...logs].sort((a, b) => new Date(a.date) - new Date(b.date))) {
      if (l.total >= goal) { tmp++; if (tmp > best) best = tmp; } else tmp = 0;
    }
    return { current: cur, best: Math.max(best, cur) };
  }, [logs, goal]);
  const chartData = last7.map(l => ({ day: new Date(l.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' }), amount: l.total, hit: l.total >= goal }));
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return <div className="rounded-xl p-3" style={{ background: '#1A2F3D', border: '1px solid rgba(0,229,204,0.2)', fontSize: 12 }}><p style={{ color: '#8CA3B5' }}>{label}</p><p style={{ color: '#fff', fontWeight: 700 }}>{payload[0].value} ml</p></div>;
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-6 pb-28">
      <div className="pt-1">
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>Analytics</h2>
        <p style={{ color: '#8CA3B5', fontSize: 13, marginTop: 2 }}>Last 7 days overview</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Activity />} label="Avg Daily" value={`${avgIntake} ml`} accent="#00E5CC" />
        <StatCard icon={<Target />} label="Goals Hit" value={`${goalsHit}/7`} accent="#6C63FF" />
        <StatCard icon={<Flame />} label="Streak" value={`${streaks.current}d`} accent="#F5A623" />
        <StatCard icon={<Award />} label="Best Streak" value={`${streaks.best}d`} accent="#ec4899" />
      </div>
      <div className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Weekly Intake</p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={28}>
              <XAxis dataKey="day" stroke="#8CA3B5" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#8CA3B5" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,229,204,0.04)' }} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.hit ? 'url(#barHit)' : 'rgba(138,163,181,0.2)'} />)}
              </Bar>
              <defs><linearGradient id="barHit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00E5CC" /><stop offset="100%" stopColor="#6C63FF" /></linearGradient></defs>
            </BarChart>
          </ResponsiveContainer>
        ) : <p style={{ color: '#8CA3B5', textAlign: 'center', fontSize: 13, padding: '32px 0' }}>No data yet — start logging water.</p>}
        <div className="flex gap-4 mt-3">
          {[{ color: 'linear-gradient(135deg,#00E5CC,#6C63FF)', label: 'Goal reached' }, { color: 'rgba(138,163,181,0.2)', label: 'Below goal' }].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
              <span style={{ color: '#8CA3B5', fontSize: 11 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      {last7.length > 0 && (() => {
        const best = last7.reduce((m, l) => l.total > m.total ? l : m, last7[0]);
        return (
          <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.2)', boxShadow: '0 0 20px rgba(245,166,35,0.2)' }}>
              <Trophy size={22} style={{ color: '#F5A623' }} />
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 600 }}>Best day this week</p>
              <p style={{ color: '#8CA3B5', fontSize: 13, marginTop: 2 }}>{best.total} ml on {new Date(best.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'long' })}</p>
            </div>
          </div>
        );
      })()}
    </motion.div>
  );
}

function CalendarView({ data }) {
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
    const date = new Date(year, month, d).toISOString().split('T')[0];
    const log = logs.find(l => l.date === date);
    cells.push({ day: d, date, total: log?.total || 0, achieved: log ? log.total >= goal : false, partial: log && log.total > 0 && log.total < goal, isToday: date === today });
  }
  const achieved = cells.filter(c => c?.achieved).length;
  const tracked = cells.filter(c => c?.total > 0).length;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-6 pb-28">
      <div className="pt-1">
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>Calendar</h2>
        <p style={{ color: '#8CA3B5', fontSize: 13, marginTop: 2 }}>{now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#8CA3B5', fontSize: 11, marginBottom: 4 }}>Goals reached</p>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>{achieved} days</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#8CA3B5', fontSize: 11, marginBottom: 4 }}>Days tracked</p>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>{tracked} days</p>
        </div>
      </div>
      <div className="rounded-2xl p-4" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#8CA3B5' }}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.008 }}
              className="aspect-square rounded-xl flex items-center justify-center"
              style={!cell ? {} : cell.achieved ? { background: 'linear-gradient(135deg,#00E5CC,#6C63FF)', color: '#fff', boxShadow: '0 0 8px rgba(0,229,204,0.3)', fontSize: 12, fontWeight: 600 } : cell.partial ? { background: 'rgba(0,229,204,0.12)', color: '#00E5CC', border: '1px solid rgba(0,229,204,0.2)', fontSize: 12, fontWeight: 600 } : cell.isToday ? { background: 'rgba(108,99,255,0.15)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.4)', fontSize: 12, fontWeight: 600 } : { background: '#1A2F3D', color: '#8CA3B5', fontSize: 12, fontWeight: 500 }}>
              {cell?.day}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        {[{ color: 'linear-gradient(135deg,#00E5CC,#6C63FF)', label: 'Goal hit' }, { color: 'rgba(0,229,204,0.12)', border: '1px solid rgba(0,229,204,0.2)', label: 'Partial' }, { color: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.4)', label: 'Today' }].map(({ color, border, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: color, border }} />
            <span style={{ color: '#8CA3B5', fontSize: 12 }}>{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SettingsView({ data, setData }) {
  const { profile, reminders } = data;
  const goal = profile?.dailyGoal || 2500;
  const [showCalc, setShowCalc] = useState(false);
  const [calcForm, setCalcForm] = useState({ weight: profile?.weight || 70, activity: profile?.activity || 'mod', climate: profile?.climate || 'mod' });
  const recommended = calcGoal(calcForm);
  const saveGoal = () => { setData(p => ({ ...p, profile: { ...p.profile, ...calcForm, dailyGoal: recommended } })); setShowCalc(false); };
  const resetAll = () => { if (window.confirm('Reset all data and restart onboarding?')) { localStorage.removeItem('aqv_v1'); window.location.reload(); } };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-5 pb-28">
      <div className="pt-1">
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>Settings</h2>
        <p style={{ color: '#8CA3B5', fontSize: 13, marginTop: 2 }}>Customize your AquaVault</p>
      </div>
      <div className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black" style={{ background: 'rgba(0,229,204,0.12)', color: '#00E5CC' }}>{profile?.name?.charAt(0)?.toUpperCase() || '?'}</div>
          <div>
            <p style={{ color: '#fff', fontWeight: 700 }}>{profile?.name}</p>
            <p style={{ color: '#8CA3B5', fontSize: 12, marginTop: 2 }}>{profile?.weight} kg · {profile?.activity} activity · {profile?.climate} climate</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-3">
          <p style={{ color: '#fff', fontWeight: 600 }}>Daily Goal</p>
          <Target size={18} style={{ color: '#00E5CC' }} />
        </div>
        <p style={{ fontSize: 32, fontWeight: 900, color: '#00E5CC' }}>{goal} ml</p>
        <p style={{ color: '#8CA3B5', fontSize: 12, marginTop: 4, marginBottom: 16 }}>Your current daily target</p>
        <button onClick={() => setShowCalc(true)} className="flex items-center gap-2" style={{ color: '#00E5CC', fontSize: 14, fontWeight: 600 }}>
          Recalculate <ChevronRight size={14} />
        </button>
      </div>
      <div className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3"><Bell size={18} style={{ color: '#6C63FF' }} /><p style={{ color: '#fff', fontWeight: 600 }}>Reminders</p></div>
          <button onClick={() => setData(p => ({ ...p, reminders: { ...p.reminders, enabled: !p.reminders.enabled } }))}
            className="relative w-12 h-6 rounded-full transition-all" style={{ background: reminders.enabled ? '#00E5CC' : '#1A2F3D' }}>
            <motion.div animate={{ x: reminders.enabled ? 24 : 2 }} className="w-5 h-5 rounded-full bg-white absolute top-0.5" />
          </button>
        </div>
        {reminders.enabled && (
          <div>
            <label style={{ color: '#8CA3B5', fontSize: 11, display: 'block', marginBottom: 6 }}>Interval (minutes)</label>
            <input type="number" min="15" max="240" value={reminders.interval}
              onChange={e => setData(p => ({ ...p, reminders: { ...p.reminders, interval: parseInt(e.target.value) || 60 } }))}
              className="w-full p-3 rounded-xl outline-none" style={{ background: '#1A2F3D', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
          </div>
        )}
      </div>
      <button onClick={resetAll} className="w-full p-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 14 }}>
        <Trash2 size={16} /> Reset All Data
      </button>
      <AnimatePresence>
        {showCalc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setShowCalc(false)}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-3xl p-6 space-y-4 overflow-y-auto max-h-[80vh]"
              style={{ background: '#111827', border: '1px solid rgba(0,229,204,0.15)' }}>
              <div className="flex items-center justify-between">
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Recalculate Goal</h3>
                <button onClick={() => setShowCalc(false)} style={{ color: '#8CA3B5' }}><X size={20} /></button>
              </div>
              <div>
                <label style={{ color: '#8CA3B5', fontSize: 11, display: 'block', marginBottom: 6 }}>Weight (kg)</label>
                <input type="number" value={calcForm.weight} onChange={e => setCalcForm(p => ({ ...p, weight: parseInt(e.target.value) || 70 }))}
                  className="w-full p-3 rounded-xl outline-none" style={{ background: '#1A2F3D', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ color: '#8CA3B5', fontSize: 11, display: 'block', marginBottom: 6 }}>Activity Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['low','mod','high'].map(l => (
                    <button key={l} onClick={() => setCalcForm(p => ({ ...p, activity: l }))} className="p-2.5 rounded-xl text-sm font-medium transition-all"
                      style={calcForm.activity === l ? { background: '#00E5CC', color: '#0A0B0F' } : { background: '#1A2F3D', color: '#8CA3B5' }}>
                      {l === 'mod' ? 'Mod' : l.charAt(0).toUpperCase()+l.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ color: '#8CA3B5', fontSize: 11, display: 'block', marginBottom: 6 }}>Climate</label>
                <div className="grid grid-cols-3 gap-2">
                  {['cool','mod','hot'].map(c => (
                    <button key={c} onClick={() => setCalcForm(p => ({ ...p, climate: c }))} className="p-2.5 rounded-xl text-sm font-medium transition-all"
                      style={calcForm.climate === c ? { background: '#00E5CC', color: '#0A0B0F' } : { background: '#1A2F3D', color: '#8CA3B5' }}>
                      {c === 'mod' ? 'Mod' : c.charAt(0).toUpperCase()+c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(0,229,204,0.06)', border: '1px solid rgba(0,229,204,0.2)' }}>
                <p style={{ color: '#8CA3B5', fontSize: 11, marginBottom: 4 }}>Recommended Daily Goal</p>
                <p style={{ fontSize: 32, fontWeight: 900, color: '#00E5CC' }}>{recommended} ml</p>
              </div>
              <button onClick={saveGoal} className="w-full p-4 rounded-2xl font-bold" style={{ background: 'linear-gradient(135deg,#00E5CC,#00B8A6)', color: '#0A0B0F' }}>Save Goal</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function App() {
  const [data, setData] = useState(loadState);
  const [view, setView] = useState('home');
  const [toast, setToast] = useState(null);
  const [celebration, setCelebration] = useState(false);

  useEffect(() => {
    if (!data.profile) return;
    try { localStorage.setItem('aqv_v1', JSON.stringify(data)); } catch {}
  }, [data]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const addWater = useCallback((amount) => {
    const today = todayStr();
    const entry = { id: `${today}-${Date.now()}`, amount, timestamp: new Date().toISOString() };
    setData(prev => {
      const logs = [...prev.logs];
      const idx = logs.findIndex(l => l.date === today);
      const prevTotal = idx >= 0 ? logs[idx].total : 0;
      const newTotal = prevTotal + amount;
      if (idx >= 0) { logs[idx] = { ...logs[idx], entries: [...logs[idx].entries, entry], total: newTotal }; }
      else { logs.push({ date: today, entries: [entry], total: amount }); }
      if (newTotal >= prev.profile.dailyGoal && prevTotal < prev.profile.dailyGoal) { setCelebration(true); setTimeout(() => setCelebration(false), 3000); }
      return { ...prev, logs };
    });
    showToast(`+${amount} ml added`);
  }, []);

  const deleteWater = useCallback((id, amount) => {
    const today = todayStr();
    setData(prev => {
      const logs = [...prev.logs];
      const idx = logs.findIndex(l => l.date === today);
      if (idx >= 0) { logs[idx] = { ...logs[idx], entries: logs[idx].entries.filter(e => e.id !== id), total: Math.max(logs[idx].total - amount, 0) }; }
      return { ...prev, logs };
    });
    showToast(`−${amount} ml removed`);
  }, []);

  const handleOnboardComplete = (profile) => {
    setData({ profile, logs: genSampleLogs(profile.dailyGoal), reminders: { enabled: true, interval: 60 } });
  };

  if (!data.profile) return <Onboarding onComplete={handleOnboardComplete} />;

  return (
    <div className="min-h-screen relative" style={{ background: '#0A0B0F' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #00E5CC 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #6C63FF 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-5 pt-6">
        <AnimatePresence mode="wait">
          {view === 'home' && <HomeView key="home" data={data} addWater={addWater} deleteWater={deleteWater} />}
          {view === 'stats' && <StatsView key="stats" data={data} />}
          {view === 'calendar' && <CalendarView key="calendar" data={data} />}
          {view === 'settings' && <SettingsView key="settings" data={data} setData={setData} />}
        </AnimatePresence>
      </div>
      <NavBar active={view} setActive={setView} />
      <AnimatePresence>{toast && <Toast key="toast" msg={toast} />}</AnimatePresence>
      <AnimatePresence>
        {celebration && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <motion.div animate={{ rotate: [0,-10,10,-10,0], scale: [1,1.2,1,1.2,1] }} transition={{ repeat: 2, duration: 0.5 }} style={{ fontSize: 72, marginBottom: 16 }}>💧</motion.div>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: '#00E5CC' }}>Vault Sealed!</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>You hit your daily target.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
